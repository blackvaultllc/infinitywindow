import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

interface Dispute {
  id: string;
  host_id: string;
  opponent_id: string | null;
  mode: string;
  stake_ankh: number;
  stake_rarity: string | null;
  host_reported_winner: string | null;
  opponent_reported_winner: string | null;
  created_at: string;
}
interface Stake { id: string; user_id: string; kind: string; amount_ankh: number; card_name: string | null; card_rarity: string | null }

export function AdminDisputes() {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [stakes, setStakes] = useState<Record<string, Stake[]>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("arena_matches")
      .select("id,host_id,opponent_id,mode,stake_ankh,stake_rarity,host_reported_winner,opponent_reported_winner,created_at")
      .eq("status", "disputed")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Dispute[];
    setRows(list);
    if (list.length) {
      const ids = list.map((r) => r.id);
      const { data: st } = await supabase
        .from("arena_stakes")
        .select("id,match_id,user_id,kind,amount_ankh,card_name,card_rarity")
        .in("match_id", ids);
      const grouped: Record<string, Stake[]> = {};
      for (const s of (st ?? []) as Array<Stake & { match_id: string }>) {
        (grouped[s.match_id] ??= []).push(s);
      }
      setStakes(grouped);
    }
  };
  useEffect(() => { load(); }, []);

  const resolve = async (matchId: string, winnerId: string) => {
    setBusy(matchId);
    const { error } = await supabase.rpc("admin_resolve_arena_dispute", {
      _match_id: matchId,
      _winner_id: winnerId,
      _note: note[matchId] ?? null,
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Dispute resolved");
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400" />
        <h2 className="font-display text-2xl">Arena Disputes</h2>
        <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">{rows.length} open</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Both players reported conflicting winners. Pick the rightful victor — the pot is paid out and stakes released.</p>
      <div className="mt-4 space-y-4">
        {rows.map((r) => {
          const ss = stakes[r.id] ?? [];
          return (
            <div key={r.id} className="rounded-xl border border-amber-500/30 bg-card/60 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}… · {r.mode} · {r.stake_rarity ? `card (${r.stake_rarity})` : `${Number(r.stake_ankh)} Ankh`}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                <div className="rounded-md border border-border/40 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Host</div>
                  <div className="font-mono">{r.host_id.slice(0, 12)}…</div>
                  <div className="mt-1">Claims winner: <span className="font-mono">{(r.host_reported_winner ?? "—").slice(0, 12)}…</span></div>
                </div>
                <div className="rounded-md border border-border/40 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Opponent</div>
                  <div className="font-mono">{(r.opponent_id ?? "—").slice(0, 12)}…</div>
                  <div className="mt-1">Claims winner: <span className="font-mono">{(r.opponent_reported_winner ?? "—").slice(0, 12)}…</span></div>
                </div>
              </div>
              {ss.length > 0 && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Locked stakes: {ss.map((s) => `${s.user_id.slice(0,6)}… → ${s.kind === "ankh" ? `${Number(s.amount_ankh)} Ankh` : (s.card_name ?? "card")}`).join(" · ")}
                </div>
              )}
              <textarea
                value={note[r.id] ?? ""}
                onChange={(e) => setNote((p) => ({ ...p, [r.id]: e.target.value }))}
                placeholder="Resolution note (logged to mod actions)"
                className="mt-3 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === r.id} onClick={() => resolve(r.id, r.host_id)} className="bg-amber-500 text-background hover:bg-amber-600">
                  {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Host wins"}
                </Button>
                {r.opponent_id && (
                  <Button size="sm" disabled={busy === r.id} onClick={() => resolve(r.id, r.opponent_id!)} variant="outline">
                    Opponent wins
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-lg border border-border/40 p-6 text-center text-xs text-muted-foreground">No open disputes. 𓂀</div>}
      </div>
    </div>
  );
}