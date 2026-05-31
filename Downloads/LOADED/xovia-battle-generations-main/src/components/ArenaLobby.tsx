import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Coins, Swords, Trophy, Lock, Loader2 } from "lucide-react";
import { useLockedCards } from "@/hooks/useLockedCards";

type Mode = "coin" | "card";
type MatchRow = {
  id: string;
  mode: string;
  status: string;
  host_id: string;
  opponent_id: string | null;
  stake_ankh: number;
  stake_rarity: string | null;
  winner_id: string | null;
  host_reported_winner: string | null;
  opponent_reported_winner: string | null;
};

const COIN_TIERS = [50, 250, 1000];
const RARITIES = ["Common", "Rare", "Divine", "Legendary"];

export function ArenaLobby() {
  const { user } = useAuth();
  const lockedCards = useLockedCards();
  const [open, setOpen] = useState<MatchRow[]>([]);
  const [mine, setMine] = useState<MatchRow[]>([]);
  const [tab, setTab] = useState<Mode>("coin");
  const [coinTier, setCoinTier] = useState(50);
  const [rarity, setRarity] = useState("Common");
  const [cardId, setCardId] = useState("");
  const [busy, setBusy] = useState(false);
  const [vault, setVault] = useState<{ card_id: string; card_name: string; card_rarity: string; quantity: number }[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("arena_matches")
      .select("*")
      .in("status", ["open", "active", "disputed"])
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as MatchRow[];
    setOpen(rows.filter((r) => r.status === "open" && r.host_id !== user?.id));
    setMine(rows.filter((r) => r.host_id === user?.id || r.opponent_id === user?.id));
    if (user) {
      const { data: cards } = await supabase
        .from("user_cards").select("card_id, card_name, card_rarity, quantity").eq("user_id", user.id);
      setVault((cards ?? []) as typeof vault);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const ch = supabase.channel("arena_lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_matches" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const requireAuth = () => {
    if (!user) { toast.error("Sign in to wager."); return false; }
    return true;
  };

  const create = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const args = tab === "coin"
        ? { _mode: "coin", _stake_ankh: coinTier }
        : { _mode: "card", _stake_ankh: 0, _card_id: cardId };
      if (tab === "card" && !cardId) { toast.error("Choose a card to wager."); setBusy(false); return; }
      const { error } = await supabase.rpc("create_arena_match", args);
      if (error) throw error;
      toast.success(tab === "coin" ? `Posted: ${coinTier} Ankh wager` : "Card wager posted");
      setCardId("");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const accept = async (m: MatchRow) => {
    if (!requireAuth()) return;
    let pickId: string | undefined = undefined;
    if (m.mode === "card") {
      const match = vault.find((v) => v.card_rarity === m.stake_rarity && v.quantity > 0);
      if (!match) { toast.error(`You need a ${m.stake_rarity} card to accept.`); return; }
      pickId = match.card_id;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("accept_arena_match", pickId ? { _match_id: m.id, _card_id: pickId } : { _match_id: m.id });
      if (error) throw error;
      toast.success("Match accepted. Play the duel below, then report the result.");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const cancel = async (id: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("cancel_arena_match", { _match_id: id });
      if (error) throw error;
      toast.success("Match cancelled. Stake returned.");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const report = async (m: MatchRow, winnerId: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("report_arena_result", { _match_id: m.id, _winner_id: winnerId });
      if (error) throw error;
      const res = data as { status: string } | null;
      if (res?.status === "settled") toast.success("Match settled. Rewards transferred.");
      else if (res?.status === "disputed") toast("Reports disagree — flagged for admin review.");
      else toast("Result recorded. Waiting on opponent.");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mb-6 rounded-xl border border-gold/30 bg-card/50 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400">Wager Arena</div>
          <h2 className="mt-1 font-display text-2xl text-gradient-gold">Stake Your Glory</h2>
          <p className="mt-1 text-xs text-muted-foreground">Coin wagers pay winner from a doubled pot (2.5% house fee). Card wagers transfer the loser's card to the winner's vault.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Create */}
        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="mb-3 flex gap-2">
            <button onClick={() => setTab("coin")} className={`flex-1 rounded-md border px-3 py-2 text-xs uppercase tracking-widest ${tab==="coin"?"border-amber-500/70 bg-amber-500/10 text-amber-300":"border-border/60 text-muted-foreground"}`}>
              <Coins className="inline h-3.5 w-3.5 mr-1" /> Coin Wager
            </button>
            <button onClick={() => setTab("card")} className={`flex-1 rounded-md border px-3 py-2 text-xs uppercase tracking-widest ${tab==="card"?"border-crimson/70 bg-crimson/10 text-crimson":"border-border/60 text-muted-foreground"}`}>
              <Swords className="inline h-3.5 w-3.5 mr-1" /> Card Wager
            </button>
          </div>

          {tab === "coin" ? (
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Stake (Ankh)</div>
              <div className="flex gap-2">
                {COIN_TIERS.map((t) => (
                  <button key={t} onClick={() => setCoinTier(t)} className={`flex-1 rounded-md border px-3 py-2 font-display ${coinTier===t?"border-amber-500/80 bg-amber-500/15 text-amber-300":"border-border/60 text-muted-foreground hover:text-foreground"}`}>
                    ☥ {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Pot: ☥ {coinTier*2}. Winner takes ☥ {Math.round(coinTier*2*0.975)} after fee.</p>
            </div>
          ) : (
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Pick a card from your vault</div>
              <select value={cardId} onChange={(e) => { setCardId(e.target.value); const c = vault.find(v=>v.card_id===e.target.value); if(c) setRarity(c.card_rarity); }}
                className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm">
                <option value="">Choose a card…</option>
                {vault.filter(v => v.card_rarity !== "Exodius" && v.quantity > 0 && !lockedCards.has(v.card_id)).map(v => (
                  <option key={v.card_id} value={v.card_id}>{v.card_name} ({v.card_rarity})</option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-muted-foreground">Opponent must stake a card of matching rarity ({rarity}). Loser's card transfers to winner.</p>
              {lockedCards.size > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400"><Lock className="h-3 w-3" />{lockedCards.size} card{lockedCards.size===1?"":"s"} locked in active wagers</p>
              )}
            </div>
          )}

          <Button onClick={create} disabled={busy || !user} className="mt-4 w-full bg-gold text-gold-foreground hover:bg-gold/90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post wager"}
          </Button>
          {!user && <p className="mt-2 text-center text-[11px] text-muted-foreground">Sign in to post a wager.</p>}
        </div>

        {/* Open lobby */}
        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Open challenges ({open.length})</div>
          <div className="max-h-[260px] space-y-2 overflow-y-auto">
            {open.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open wagers. Post the first one.</p>
            ) : open.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card/60 p-2 text-xs">
                <div>
                  <div className="font-display text-foreground">
                    {m.mode === "coin" ? <><Coins className="inline h-3 w-3 text-amber-400 mr-1"/> ☥ {Number(m.stake_ankh)}</> : <><Swords className="inline h-3 w-3 text-crimson mr-1"/> {m.stake_rarity} card</>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Host: {m.host_id.slice(0,8)}…</div>
                </div>
                <Button size="sm" onClick={() => accept(m)} disabled={busy} className="bg-crimson text-foreground hover:bg-crimson/90">Accept</Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My matches */}
      {mine.length > 0 && (
        <div className="mt-4 rounded-lg border border-gold/40 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold"><Trophy className="h-3 w-3" /> Your active wagers</div>
          <div className="space-y-2">
            {mine.map((m) => {
              const isHost = m.host_id === user?.id;
              const myReport = isHost ? m.host_reported_winner : m.opponent_reported_winner;
              const oppReport = isHost ? m.opponent_reported_winner : m.host_reported_winner;
              return (
                <div key={m.id} className="rounded-md border border-border/60 bg-card/60 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-foreground">
                        {m.mode === "coin" ? `☥ ${Number(m.stake_ankh)} wager` : `${m.stake_rarity} card wager`}
                      </span>
                      <span className="ml-2 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{m.status}</span>
                      {m.status === "active" && <span className="ml-2 inline-flex items-center gap-1 text-amber-400"><Lock className="h-3 w-3"/>stake locked</span>}
                    </div>
                    <div className="flex gap-2">
                      {m.status === "open" && isHost && (
                        <Button size="sm" variant="outline" onClick={() => cancel(m.id)} disabled={busy}>Cancel</Button>
                      )}
                      {(m.status === "active" || m.status === "disputed") && !myReport && (
                        <>
                          <Button size="sm" onClick={() => report(m, user!.id)} disabled={busy} className="bg-gold text-gold-foreground">I won</Button>
                          <Button size="sm" variant="outline" onClick={() => report(m, isHost ? m.opponent_id! : m.host_id)} disabled={busy}>I lost</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {(myReport || oppReport) && m.status !== "settled" && (
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      You reported: {myReport ? (myReport===user?.id?"win":"loss") : "—"} · Opponent reported: {oppReport ? "yes" : "waiting"}
                    </div>
                  )}
                  {m.status === "disputed" && (
                    <div className="mt-2 text-[10px] text-crimson">Reports disagree — awaiting admin resolution.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
