// Server-only Stripe helpers. Never import from client code.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  _stripe = new Stripe(key, { apiVersion: "2024-09-30.acacia" as never });
  return _stripe;
}

export const PLATFORM_FEE_BPS = 1500; // 15%

export function computeFee(amountCents: number) {
  const fee = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
  return { fee, sitterAmount: amountCents - fee };
}

/** Build authed user-scoped Supabase client from a Bearer token. */
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  return { supabase, userId: data.claims.sub as string };
}

/** Admin client (service role) — bypasses RLS. */
export function getAdmin() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } }
  );
}

export function getOrigin(request: Request) {
  const fwd = request.headers.get("x-forwarded-host");
  const host = fwd ?? request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
