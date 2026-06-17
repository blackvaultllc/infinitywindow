import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SLOTS = ["intro"] as const;
type Slot = (typeof SLOTS)[number];

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("role check failed");
  const owned = new Set((data ?? []).map((r: any) => r.role));
  if (!owned.has("admin")) throw new Error("Forbidden: admin only");
}

/** Public: anonymous visitors call this to get the active splash URL. */
export const getSplashPlayback = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ slot: z.enum(SLOTS).default("intro") }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("splash_videos")
      .select("video_path,enabled")
      .eq("slot", data.slot)
      .maybeSingle();
    if (!row || !row.enabled || !row.video_path) {
      return { signedUrl: null as string | null };
    }
    const { data: signed } = await supabaseAdmin.storage
      .from("splash")
      .createSignedUrl(row.video_path, 60 * 60);
    return { signedUrl: signed?.signedUrl ?? null };
  });

export const adminListSplash = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("splash_videos")
      .select("slot,video_path,enabled,updated_at");
    const byCat = new Map((data ?? []).map((r: any) => [r.slot, r]));
    return SLOTS.map((slot) => {
      const r = byCat.get(slot);
      return {
        slot,
        videoPath: (r?.video_path as string | null) ?? null,
        enabled: r?.enabled !== false,
        updatedAt: r?.updated_at ?? null,
      };
    });
  });

export const adminUpsertSplash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slot: z.enum(SLOTS),
        videoPath: z.string().min(1).max(500).nullable().optional(),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update = {
      slot: data.slot,
      enabled: data.enabled,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
      ...(data.videoPath !== undefined ? { video_path: data.videoPath } : {}),
    };
    const { error } = await supabaseAdmin
      .from("splash_videos")
      .upsert(update, { onConflict: "slot" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateSplashUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slot: z.enum(SLOTS),
        contentType: z
          .string()
          .min(1)
          .max(100)
          .regex(/^video\/(mp4|webm|quicktime)$/),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext =
      data.contentType === "video/mp4"
        ? "mp4"
        : data.contentType === "video/webm"
          ? "webm"
          : "mov";
    const path = `${data.slot}/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("splash")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "sign failed");
    return { uploadUrl: signed.signedUrl, token: signed.token, path };
  });

export const adminDeleteSplashVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slot: z.enum(SLOTS) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("splash_videos")
      .select("video_path")
      .eq("slot", data.slot)
      .maybeSingle();
    if (row?.video_path) {
      await supabaseAdmin.storage.from("splash").remove([row.video_path]);
    }
    await supabaseAdmin
      .from("splash_videos")
      .update({ video_path: null, updated_by: context.userId })
      .eq("slot", data.slot);
    return { ok: true };
  });
