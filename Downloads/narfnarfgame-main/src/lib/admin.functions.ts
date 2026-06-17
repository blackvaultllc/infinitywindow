import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertRole(
  supabase: any,
  userId: string,
  roles: Array<"admin" | "moderator" | "support">,
) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("role check failed");
  const owned = new Set((data ?? []).map((r: any) => r.role));
  if (!roles.some((r) => owned.has(r))) throw new Error("Forbidden");
}

export const adminGrantCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid(),
        delta: z.number().int().min(-1_000_000).max(1_000_000),
        reason: z.string().trim().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("coins")
      .eq("id", data.targetUserId)
      .single();
    if (pErr || !profile) throw new Error("target not found");
    await supabaseAdmin.from("coin_ledger").insert({
      user_id: data.targetUserId,
      delta: data.delta,
      reason: data.reason,
      granted_by: context.userId,
    });
    await supabaseAdmin
      .from("profiles")
      .update({ coins: (profile.coins ?? 0) + data.delta })
      .eq("id", data.targetUserId);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "grant_coins",
      target_user: data.targetUserId,
      details: { delta: data.delta, reason: data.reason },
    });
    return { ok: true };
  });

export const adminGrantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "support", "player"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.targetUserId, role: data.role });
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "grant_role",
      target_user: data.targetUserId,
      details: { role: data.role },
    });
    return { ok: true };
  });

export const adminSetBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetUserId: z.string().uuid(), banned: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    // Admins can ban/unban anyone; moderators can ban but not unban.
    if (data.banned) {
      await assertRole(context.supabase, context.userId, ["admin", "moderator"]);
    } else {
      await assertRole(context.supabase, context.userId, ["admin"]);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ banned: data.banned })
      .eq("id", data.targetUserId);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: data.banned ? "ban" : "unban",
      target_user: data.targetUserId,
      details: {},
    });
    return { ok: true };
  });