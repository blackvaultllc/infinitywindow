import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Returns the set of card_ids the current user has locked inside an active or disputed arena wager. */
export function useLockedCards(): Set<string> {
  const { user } = useAuth();
  const [locked, setLocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setLocked(new Set()); return; }
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("arena_stakes")
        .select("card_id, released, arena_matches!inner(status)")
        .eq("user_id", user.id)
        .eq("kind", "card")
        .eq("released", false);
      if (!alive) return;
      const ids = new Set<string>();
      for (const row of (data ?? []) as Array<{ card_id: string | null; arena_matches: { status: string } | null }>) {
        const status = row.arena_matches?.status;
        if (row.card_id && status && status !== "settled") ids.add(row.card_id);
      }
      setLocked(ids);
    };
    load();
    const ch = supabase.channel(`locked_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_stakes", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_matches" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [user]);

  return locked;
}