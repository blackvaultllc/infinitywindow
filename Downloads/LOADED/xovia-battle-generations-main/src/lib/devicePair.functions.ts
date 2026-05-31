import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Phone-side: the signed-in user approves a desktop pairing token. We mint a
 * one-time magic-link token on the user's behalf via the admin client, then
 * write the `hashed_token` back so the desktop's poll can pick it up and
 * verify it via `supabase.auth.verifyOtp`.
 */
export const approveDevicePair = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      token: z.string().min(16).max(128).regex(/^[a-f0-9]+$/i),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Fetch the requester's email — needed to mint the magic link
    const { data: u, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !u?.user?.email) {
      throw new Error("Could not load your account email.");
    }
    const email = u.user.email;

    // Validate the pair token state through the user's RLS-bound client first
    const { data: lookup, error: lookupErr } = await supabase.rpc("device_pair_lookup", {
      _token: data.token,
    });
    if (lookupErr) throw new Error(lookupErr.message);
    const status = (lookup as { status?: string } | null)?.status;
    if (status !== "pending") {
      throw new Error(`Pair token is ${status ?? "unavailable"}.`);
    }

    // Mint a one-time magic link the desktop can verify
    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Could not mint pairing token.");
    }
    const tokenHash = link.properties.hashed_token;

    // Record approval (security definer; checks auth.uid())
    const { error: markErr } = await supabase.rpc("device_pair_mark_approved", {
      _token: data.token,
      _token_hash: tokenHash,
      _email: email,
    });
    if (markErr) throw new Error(markErr.message);

    return { ok: true as const };
  });