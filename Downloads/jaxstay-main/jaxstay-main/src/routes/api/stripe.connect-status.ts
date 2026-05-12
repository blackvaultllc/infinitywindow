import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/stripe/connect-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if ("error" in auth) return auth.error;
        const { supabase, userId } = auth;

        const { data: profile } = await supabase.rpc("get_my_profile");

        if (!profile?.stripe_account_id) {
          return Response.json({ connected: false, charges_enabled: false, payouts_enabled: false });
        }

        const stripe = getStripe();
        const account = await stripe.accounts.retrieve(profile.stripe_account_id);
        const onboarding_complete = !!account.details_submitted;

        await supabase
          .from("profiles")
          .update({
            stripe_onboarding_complete: onboarding_complete,
            stripe_charges_enabled: !!account.charges_enabled,
            stripe_payouts_enabled: !!account.payouts_enabled,
          } as never)
          .eq("id", userId);

        return Response.json({
          connected: true,
          onboarding_complete,
          charges_enabled: !!account.charges_enabled,
          payouts_enabled: !!account.payouts_enabled,
        });
      },
    },
  },
});
