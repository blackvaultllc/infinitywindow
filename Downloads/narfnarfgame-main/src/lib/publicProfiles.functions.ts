import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SAFE_COLS = "id,username,display_name,avatar_url,bio,region,prologue_choice,alignment_locked,is_minor,show_online,last_seen_at";

/** Look up a single public profile by username. Returns only safe fields. */
export const getPublicProfileByUsername = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().min(1).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select(SAFE_COLS)
      .ilike("username", data.username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    let clan: { id: string; name: string; slug: string; role: string } | null = null;
    if (row?.id) {
      const { data: cm } = await supabaseAdmin
        .from("clan_members")
        .select("role, clan_id, clans(id,name,slug)")
        .eq("user_id", row.id)
        .maybeSingle();
      const c = (cm as any)?.clans;
      if (c) clan = { id: c.id, name: c.name, slug: c.slug, role: (cm as any).role };
    }
    return { profile: row ? { ...row, clan } : null };
  });

/** Batch-fetch public profiles by user id. Returns only safe fields. */
export const getPublicProfilesByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return { profiles: [] as any[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select(SAFE_COLS)
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { profiles: rows ?? [] };
  });