import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const HEIR_EMAIL = "khadijahall0325x@gmail.com";

export const provisionHeir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(8).max(128) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Owner-only gate
    const { data: ownerCheck } = await context.supabase.rpc("is_owner", { _uid: context.userId });
    if (!ownerCheck) throw new Error("Forbidden — owner only");

    // 1. Try to find existing user by email
    let userId: string | null = null;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data?.users.find((u) => u.email?.toLowerCase() === HEIR_EMAIL);

    if (existing) {
      userId = existing.id;
      // Update password to whatever owner re-typed (idempotent reset)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
      });
    } else {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: HEIR_EMAIL,
        password: data.password,
        email_confirm: true,
        user_metadata: { display_name: "Khadija", role_hint: "heir" },
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "Failed to create heir user");
      }
      userId = created.data.user.id;
    }

    // 2. Finalize: profile + heir role (idempotent)
    const { error: finErr } = await supabaseAdmin.rpc("finalize_heir_setup", { _user_id: userId });
    if (finErr) throw new Error(`finalize_heir_setup: ${finErr.message}`);

    // 3. Audit log
    await supabaseAdmin.from("mod_actions").insert({
      actor_id: context.userId,
      target_user_id: userId,
      action: "provision_heir",
      reason: "Heir account provisioned via Owner Console",
    });

    return { ok: true, userId };
  });

export const backfillHeirCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("backfill_heir_collection");
    if (error) throw new Error(error.message);
    return data;
  });