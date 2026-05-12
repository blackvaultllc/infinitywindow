import { createFileRoute } from "@tanstack/react-router";
import { getStripe, getUserFromRequest, getOrigin } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/stripe/connect-onboard")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if ("error" in auth) return auth.error;
        const { supabase, userId } = auth;

        const { data: profile, error: pErr } = await supabase.rpc("get_my_profile");
        if (pErr || !profile) return new Response("Profile not found", { status: 404 });

        const stripe = getStripe();
        let accountId = profile.stripe_account_id;

        if (!accountId) {
          const account = await stripe.accounts.create({
            type: "express",
            email: profile.email ?? undefined,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: { user_id: userId },
          });
          accountId = account.id;
          await supabase
            .from("profiles")
            .update({ stripe_account_id: accountId } as never)
            .eq("id", userId);
        }

        const origin = getOrigin(request);
        const link = await stripe.accountLinks.create({
          account: accountId,
          type: "account_onboarding",
          refresh_url: `${origin}/dashboard?stripe=refresh`,
          return_url: `${origin}/dashboard?stripe=connected`,
        });

        return Response.json({ url: link.url });
      },
    },
  },
});
