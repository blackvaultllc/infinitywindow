// Hourly cron: auto-release payouts for confirmed bookings whose end_date is >24h ago.
import { createFileRoute } from "@tanstack/react-router";
import { getAdmin } from "@/lib/stripe.server";
import { releasePayout } from "../bookings.complete";

export const Route = createFileRoute("/api/public/cron/auto-release-payouts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const admin = getAdmin();
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10); // YYYY-MM-DD
        const { data, error } = await admin
          .from("bookings")
          .select("*")
          .eq("payment_status", "paid")
          .eq("payout_released", false)
          .lte("end_date", cutoff);
        if (error) return new Response(error.message, { status: 500 });

        const results: Array<{ id: string; ok: boolean; error?: string }> = [];
        for (const b of data ?? []) {
          try {
            await releasePayout(b as never);
            results.push({ id: b.id, ok: true });
          } catch (e) {
            results.push({ id: b.id, ok: false, error: (e as Error).message });
          }
        }
        return Response.json({ processed: results.length, results });
      },
    },
  },
});
