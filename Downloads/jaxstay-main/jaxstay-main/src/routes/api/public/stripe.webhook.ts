// Stripe webhook. Signature verified with STRIPE_WEBHOOK_SECRET.
import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { getStripe, getAdmin } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const stripe = getStripe();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        } catch (e) {
          return new Response(`Invalid signature: ${(e as Error).message}`, { status: 400 });
        }

        const admin = getAdmin();

        switch (event.type) {
          case "checkout.session.completed": {
            const s = event.data.object as Stripe.Checkout.Session;
            const bookingId = s.metadata?.booking_id;
            if (bookingId) {
              await admin
                .from("bookings")
                .update({
                  payment_status: "paid",
                  status: "confirmed",
                  stripe_payment_intent_id: s.payment_intent as string,
                  stripe_checkout_session_id: s.id,
                } as never)
                .eq("id", bookingId);
            }
            break;
          }
          case "account.updated": {
            const acct = event.data.object as Stripe.Account;
            await admin
              .from("profiles")
              .update({
                stripe_onboarding_complete: !!acct.details_submitted,
                stripe_charges_enabled: !!acct.charges_enabled,
                stripe_payouts_enabled: !!acct.payouts_enabled,
              } as never)
              .eq("stripe_account_id", acct.id);
            break;
          }
          case "charge.refunded": {
            const charge = event.data.object as Stripe.Charge;
            const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
            if (pi) {
              await admin
                .from("bookings")
                .update({ payment_status: "refunded", status: "cancelled" } as never)
                .eq("stripe_payment_intent_id", pi);
            }
            break;
          }
          default:
            break;
        }

        return Response.json({ received: true });
      },
    },
  },
});
