// Marks a booking complete and releases the payout to the sitter.
import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getAdmin, computeFee } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/bookings/complete")({
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
          return new Response("Only the owner can confirm completion", { status: 403 });
        if (booking.payment_status !== "paid")
          return new Response("Booking is not paid", { status: 400 });

        await releasePayout(booking);
        return Response.json({ ok: true });
      },
    },
  },
});

export async function releasePayout(booking: {
  id: string;
  sitter_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number | null;
  platform_fee_cents: number | null;
  payout_released: boolean;
}) {
  if (booking.payout_released) return;
  if (!booking.stripe_payment_intent_id || !booking.amount_cents) {
    throw new Error("Missing payment data on booking");
  }

  const admin = getAdmin();

  // Atomic guard against duplicate transfers
  const { data: claimed, error: claimErr } = await admin
    .from("bookings")
    .update({ payout_released: true, payout_released_at: new Date().toISOString(), completed_at: new Date().toISOString() } as never)
    .eq("id", booking.id)
    .eq("payout_released", false)
    .select("id")
    .maybeSingle();
  if (claimErr || !claimed) return; // already released by someone else

  const { data: sitter } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", booking.sitter_id)
    .maybeSingle();
  if (!sitter?.stripe_account_id) {
    // roll back the claim so admins can retry
    await admin.from("bookings").update({ payout_released: false, completed_at: null } as never).eq("id", booking.id);
    throw new Error("Sitter has no connected Stripe account");
  }

  const fee = booking.platform_fee_cents ?? computeFee(booking.amount_cents).fee;
  const sitterAmount = booking.amount_cents - fee;

  const stripe = getStripe();
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: sitterAmount,
        currency: "usd",
        destination: sitter.stripe_account_id,
        transfer_group: `booking_${booking.id}`,
        source_transaction: undefined,
        metadata: { booking_id: booking.id },
      },
      { idempotencyKey: `payout:${booking.id}` }
    );
    await admin
      .from("bookings")
      .update({
        stripe_transfer_id: transfer.id,
        payment_status: "released",
        status: "completed",
      } as never)
      .eq("id", booking.id);
  } catch (e) {
    // roll back if Stripe call fails
    await admin
      .from("bookings")
      .update({ payout_released: false, completed_at: null } as never)
      .eq("id", booking.id);
    throw e;
  }
}
