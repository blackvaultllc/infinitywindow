import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "moderator" | "support" | "player";

export interface ProfileSummary {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  coins: number;
  bonus_multiplier: number;
  banned: boolean;
  prologue_choice: "planet" | "humans" | "watcher" | null;
  alignment_locked: boolean;
  tutorial_seen: boolean;
  username: string | null;
  bio: string | null;
  region: string | null;
  onboarding_complete: boolean;
  tour_step: number;
  ui_mode: "regular" | "advanced";
  roles: Role[];
  clan_id?: string | null;
  clan_role?: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async ({ silent = false }: { silent?: boolean } = {}) => {
    // Only show the "loading" state on the very first fetch. Subsequent
    // refetches (auth state changes, mutations) must not blank the UI —
    // that was causing the whole app to flash back to placeholder/redirect
    // states every time Supabase emitted a token refresh.
    if (!silent) setLoading((prev) => (prev ? prev : prev));
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: r }, { data: clanMember }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
      supabase.from("clan_members").select("clan_id,role").eq("user_id", auth.user.id).maybeSingle(),
    ]);
    if (p) {
      setProfile({
        ...(p as any),
        roles: ((r as any[]) ?? []).map((x) => x.role as Role),
        clan_id: (clanMember as any)?.clan_id ?? null,
        clan_role: (clanMember as any)?.role ?? null,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      // Refresh silently so we never go back to a `loading=true` flash mid-session.
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        load({ silent: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { profile, loading, reload: () => load({ silent: true }) };
}

export const hasAnyRole = (p: ProfileSummary | null, roles: Role[]) =>
  !!p && p.roles.some((r) => roles.includes(r));