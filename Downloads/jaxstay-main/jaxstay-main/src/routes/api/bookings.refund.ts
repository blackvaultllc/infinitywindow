// Owner cancels a paid booking before completion -> full refund (platform absorbs fee).
import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getAdmin } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/bookings/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if ("error" in auth) return auth.error;
        const { supabase, userId } = auth;

        const { bookingId } = (await request.json().catch(() => ({}))) as {
          bookingId?: string;
        };
        if (!bookingId) return new Response("bookingId required", { status: 400 });

        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();
        if (!booking) return new Response("Booking not found", { status: 404 });
        if (booking.owner_id !== userId)
          return new Response("Only the owner can request a refund", { status: 403 });
        if (booking.payment_status !== "paid")
          return new Response("Booking is not refundable", { status: 400 });
        if (booking.payout_released)
          return new Response("Payout already released — contact support", { status: 400 });
        if (!booking.stripe_payment_intent_id)
          return new Response("Missing payment intent", { status: 400 });

        const stripe = getStripe();
        const refund = await stripe.refunds.create(
          { payment_intent: booking.stripe_payment_intent_id },
          { idempotencyKey: `refund:${booking.id}` }
        );

        const admin = getAdmin();
        await admin
          .from("bookings")
          .update({
            payment_status: "refunded",
            status: "cancelled",
            stripe_refund_id: refund.id,
          } as never)
          .eq("id", booking.id);

        return Response.json({ ok: true });
      },
    },
  },
});
