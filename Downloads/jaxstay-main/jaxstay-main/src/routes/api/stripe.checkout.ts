import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getOrigin, computeFee } from "@/lib/stripe.server";
import { computeTransportQuote, type TierPrices } from "@/lib/transport-pricing";
import type { DistanceTierKey, TripTypeKey } from "@/data/city-coords";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if ("error" in auth) return auth.error;
        const { supabase, userId } = auth;

        const { bookingId } = (await request.json().catch(() => ({}))) as { bookingId?: string };
        if (!bookingId) return new Response("bookingId required", { status: 400 });

        const { data: booking } = await supabase
          .from("bookings").select("*").eq("id", bookingId).maybeSingle();
        if (!booking) return new Response("Booking not found", { status: 404 });
        if (booking.owner_id !== userId) return new Response("Only the owner can pay", { status: 403 });
        if (booking.status !== "awaiting_payment")
          return new Response(`Booking is ${booking.status}, not awaiting_payment`, { status: 400 });
        if (booking.payment_status === "paid") return new Response("Already paid", { status: 400 });

        const { data: sitter } = await supabase
          .from("profiles")
          .select("id, full_name, sitter_rate, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, sitter_transport_enabled, sitter_transport_prices_by_tier, sitter_extra_stop_fee_cents, sitter_waiting_fee_per_hour_cents")
          .eq("id", booking.sitter_id).maybeSingle();
        if (!sitter?.stripe_account_id || !sitter.stripe_charges_enabled || !sitter.stripe_payouts_enabled) {
          return new Response("Sitter has not finished payout setup yet", { status: 400 });
        }

        const isTransport = (booking as { service_category?: string }).service_category === "transport";
        let amountCents: number;
        let lineName: string;
        let lineDesc: string;

        if (isTransport) {
          const s = sitter as typeof sitter & {
            sitter_transport_enabled?: boolean;
            sitter_transport_prices_by_tier?: TierPrices;
            sitter_extra_stop_fee_cents?: number | null;
            sitter_waiting_fee_per_hour_cents?: number | null;
          };
          if (!s.sitter_transport_enabled) return new Response("Sitter does not offer transport", { status: 400 });
          const b = booking as typeof booking & { trip_type?: TripTypeKey; distance_tier?: DistanceTierKey };
          if (!b.trip_type || !b.distance_tier) return new Response("Missing transport details", { status: 400 });
          const quote = computeTransportQuote({
            tripType: b.trip_type,
            tier: b.distance_tier,
            prices: (s.sitter_transport_prices_by_tier ?? {}) as TierPrices,
            extraStopFeeCents: s.sitter_extra_stop_fee_cents ?? null,
            waitingFeePerHourCents: s.sitter_waiting_fee_per_hour_cents ?? null,
          });
          if (quote.totalCents <= 0) return new Response("Sitter has no price for this tier", { status: 400 });
          amountCents = quote.totalCents;
          lineName = "Pet Transportation Service";
          lineDesc = `${b.trip_type.replace("_", " ")} · ${b.distance_tier} · with ${sitter.full_name}`;
        } else {
          if (!sitter.sitter_rate) return new Response("Sitter rate is not set", { status: 400 });
          const start = new Date(booking.start_date);
          const end = new Date(booking.end_date);
          const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          amountCents = sitter.sitter_rate * 100 * nights;
          lineName = `${booking.service} with ${sitter.full_name}`;
          lineDesc = `${nights} night${nights > 1 ? "s" : ""} · ${booking.start_date} → ${booking.end_date}`;
        }

        if (amountCents <= 0) return new Response("Invalid amount", { status: 400 });
        const { fee } = computeFee(amountCents);
        const stripe = getStripe();
        const origin = getOrigin(request);

        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [{
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: amountCents,
                product_data: { name: lineName, description: lineDesc },
              },
            }],
            payment_intent_data: {
              transfer_group: `booking_${booking.id}`,
              metadata: { booking_id: booking.id, sitter_id: booking.sitter_id, owner_id: booking.owner_id },
            },
            success_url: `${origin}/bookings?paid=${booking.id}`,
            cancel_url: `${origin}/bookings?cancel=${booking.id}`,
            metadata: { booking_id: booking.id, sitter_id: booking.sitter_id, owner_id: booking.owner_id },
          },
          { idempotencyKey: `checkout:${booking.id}:${booking.updated_at ?? ""}` }
        );

        await supabase.from("bookings").update({
          stripe_checkout_session_id: session.id,
          amount_cents: amountCents,
          platform_fee_cents: fee,
        } as never).eq("id", booking.id);

        return Response.json({ url: session.url });
      },
    },
  },
});
