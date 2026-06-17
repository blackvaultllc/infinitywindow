import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const POWER_CATEGORIES = [
  "Fire",
  "Biological",
  "Electromagnetic",
  "Atmospheric",
  "Geological",
  "Hydrological",
  "Cosmic",
  "SlowBurn",
] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("role check failed");
  const owned = new Set((data ?? []).map((r: any) => r.role));
  if (!owned.has("admin")) throw new Error("Forbidden: admin only");
}

/** Any authenticated user: get a playback URL for the given power's cutscene. */
export const getCutscenePlayback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ powerCategory: z.enum(POWER_CATEGORIES) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("cutscenes")
      .select("video_path,duration_seconds,enabled")
      .eq("power_category", data.powerCategory)
      .maybeSingle();
    if (!row || !row.enabled || !row.video_path) {
      return { signedUrl: null as string | null, durationSeconds: 0 };
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("cutscenes")
      .createSignedUrl(row.video_path, 300);
    if (error || !signed?.signedUrl) {
      return { signedUrl: null, durationSeconds: 0 };
    }
    return {
      signedUrl: signed.signedUrl,
      durationSeconds: row.duration_seconds,
    };
  });

/** Admin: list every cutscene row (including disabled, including empty). */
export const adminListCutscenes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("cutscenes")
      .select("id,power_category,video_path,duration_seconds,enabled,updated_at,updated_by");
    const byCat = new Map((data ?? []).map((r: any) => [r.power_category, r]));
    return POWER_CATEGORIES.map((cat) => {
      const r = byCat.get(cat);
      return {
        powerCategory: cat,
        videoPath: (r?.video_path as string | null) ?? null,
        durationSeconds: (r?.duration_seconds as number | undefined) ?? 5,
        enabled: r?.enabled !== false,
        updatedAt: r?.updated_at ?? null,
      };
    });
  });

/** Admin: upsert config (duration, enabled) and optionally swap video_path. */
export const adminUpsertCutscene = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        powerCategory: z.enum(POWER_CATEGORIES),
        videoPath: z.string().min(1).max(500).nullable().optional(),
        durationSeconds: z.number().int().min(1).max(60),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update = {
      power_category: data.powerCategory,
      duration_seconds: data.durationSeconds,
      enabled: data.enabled,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
      ...(data.videoPath !== undefined ? { video_path: data.videoPath } : {}),
    };
    const { error } = await supabaseAdmin
      .from("cutscenes")
      .upsert(update, { onConflict: "power_category" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: produce a signed upload URL the browser can PUT the mp4 into. */
export const adminCreateCutsceneUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        powerCategory: z.enum(POWER_CATEGORIES),
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
    const path = `${data.powerCategory.toLowerCase()}/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("cutscenes")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "sign failed");
    return { uploadUrl: signed.signedUrl, token: signed.token, path };
  });

/** Admin: delete the stored video file for a power category, clear the row's video_path. */
export const adminDeleteCutsceneVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ powerCategory: z.enum(POWER_CATEGORIES) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("cutscenes")
      .select("video_path")
      .eq("power_category", data.powerCategory)
      .maybeSingle();
    if (row?.video_path) {
      await supabaseAdmin.storage.from("cutscenes").remove([row.video_path]);
    }
    await supabaseAdmin
      .from("cutscenes")
      .update({ video_path: null, updated_by: context.userId })
      .eq("power_category", data.powerCategory);
    return { ok: true };
  });