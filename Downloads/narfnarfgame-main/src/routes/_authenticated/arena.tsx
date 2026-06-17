import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Globe2, Users, Swords, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/arena")({
  head: () => ({
    meta: [
      { title: "Arena — Narf Narf" },
      { name: "description", content: "4v4 Arena: Planet versus Humans." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ArenaPage,
});

const ABILITIES = [
  { slug: "solar_flare", name: "Solar Flare", dmg: 18, team: "planet" },
  { slug: "quake", name: "Quake", dmg: 14, team: "planet" },
  { slug: "tsunami", name: "Tsunami", dmg: 20, team: "planet" },
  { slug: "wildfire", name: "Wildfire", dmg: 12, team: "planet" },
  { slug: "satellite_strike", name: "Satellite Strike", dmg: 18, team: "humans" },
  { slug: "geo_shield", name: "Geo-Shield", dmg: 14, team: "humans" },
  { slug: "ion_cannon", name: "Ion Cannon", dmg: 20, team: "humans" },
  { slug: "stormwall", name: "Stormwall", dmg: 12, team: "humans" },
];

type Match = {
  id: string;
  status: "lobby" | "active" | "complete";
  mode: "pvp" | "ai";
  planet_score: number;
  humans_score: number;
  winner: "planet" | "humans" | null;
  turn: number;
  current_team: "planet" | "humans";
};

type Player = { user_id: string; team: "planet" | "humans"; country: string | null; slot: number; is_ready: boolean; display_name?: string | null; username?: string | null };
type Action = { id: string; user_id: string; turn: number; team: string; ability_slug: string; damage: number; created_at: string; display_name?: string | null };

function ArenaPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const resetGame = useGame((s) => s.reset);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [busy, setBusy] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const myTeam = useMemo(() => players.find(p => p.user_id === profile?.id)?.team ?? null, [players, profile?.id]);
  const me = players.find(p => p.user_id === profile?.id);

  const load = useCallback(async (id: string) => {
    const [{ data: m }, { data: ps }, { data: ax }] = await Promise.all([
      supabase.from("arena_matches" as any).select("*").eq("id", id).maybeSingle(),
      supabase.from("arena_match_players" as any).select("*").eq("match_id", id).order("slot"),
      supabase.from("arena_actions" as any).select("*").eq("match_id", id).order("turn", { ascending: false }).limit(20),
    ]);
    setMatch(((m as unknown) as Match) ?? null);
    const userIds = [...new Set([...((ps as any[]) ?? []).map(x => x.user_id), ...((ax as any[]) ?? []).map(x => x.user_id)])];
    const { data: profs } = userIds.length ? await supabase.from("profiles").select("id,display_name,username").in("id", userIds) : { data: [] as any[] };
    const map = new Map(((profs as any[]) ?? []).map(p => [p.id, p]));
    setPlayers(((ps as any[]) ?? []).map(p => ({ ...p, display_name: map.get(p.user_id)?.display_name, username: map.get(p.user_id)?.username })));
    setActions(((ax as any[]) ?? []).map(a => ({ ...a, display_name: map.get(a.user_id)?.display_name })));
  }, []);

  // Resume in-progress match on load
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("arena_match_players" as any)
        .select("match_id, arena_matches!inner(status)")
        .eq("user_id", profile.id)
        .neq("arena_matches.status", "complete")
        .limit(1);
      const id = ((data as any[]) ?? [])[0]?.match_id;
      if (id) setMatchId(id);
    })();
  }, [profile]);

  useEffect(() => {
    if (!matchId) return;
    void load(matchId);
    const ch = supabase
      .channel(`arena:${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_matches", filter: `id=eq.${matchId}` }, () => load(matchId))
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_match_players", filter: `match_id=eq.${matchId}` }, () => load(matchId))
      .on("postgres_changes", { event: "*", schema: "public", table: "arena_actions", filter: `match_id=eq.${matchId}` }, () => load(matchId))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [matchId, load]);

  const findMatch = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("arena_quickmatch" as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    setMatchId(data as string);
  };

  const startAi = () => {
    // Solo Practice should drop the player into the real command interface
    // (map + commands), NOT this turn-based arena scoreboard. Send them to
    // Select with Solo vs AI primed so they pick Terra or a human role next.
    resetGame();
    navigate({ to: "/select" });
  };

  const ready = async (val: boolean) => {
    if (!matchId) return;
    const { error } = await supabase.rpc("arena_set_ready" as any, { _match_id: matchId, _ready: val });
    if (error) toast.error(error.message);
  };

  const leave = async () => {
    if (!matchId) return;
    setBusy(true);
    const { error } = await supabase.rpc("arena_leave" as any, { _match_id: matchId });
    setBusy(false);
    if (error) return toast.error(error.message);
    setMatchId(null);
    setMatch(null);
  };

  const playAbility = async (abilitySlug: string, dmg: number) => {
    if (!matchId || !match) return;
    setBusy(true);
    const { error } = await supabase.rpc("arena_play_ability" as any, { _match_id: matchId, _ability_slug: abilitySlug, _damage: dmg });
    setBusy(false);
    if (error) return toast.error(error.message);

    // AI counter-turn
    if (match.mode === "ai") {
      setTimeout(async () => {
        const opp = ABILITIES.filter(a => a.team === "planet");
        const pick = opp[Math.floor(Math.random() * opp.length)];
        await supabase.rpc("arena_play_ability" as any, { _match_id: matchId, _ability_slug: pick.slug, _damage: pick.dmg });
      }, 900);
    }
  };

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [actions.length]);

  if (!profile) return null;

  if (!matchId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="text-center">
          <div className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Arena</div>
          <h1 className="mt-1 text-3xl font-bold">Planet vs Humans</h1>
          <p className="mt-2 text-sm text-muted-foreground">4 players per side. First to 100 damage wins. Winners earn Victory Points.</p>
          <p className="mt-1 text-xs text-[#EF9F27]">Your VP: <span className="font-semibold">{(profile as any).victory_points ?? 0}</span></p>
        </header>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button onClick={findMatch} disabled={busy} className="rounded-2xl border border-[#378ADD] bg-[#378ADD1A] p-6 text-left transition hover:bg-[#378ADD2A] disabled:opacity-50">
            <Users className="h-7 w-7 text-[#9cc6f5]" />
            <div className="mt-3 font-display text-sm uppercase tracking-widest text-[#9cc6f5]">Find Match</div>
            <h2 className="mt-1 text-xl font-bold">4v4 PvP Lobby</h2>
            <p className="mt-1 text-xs text-muted-foreground">Wait for 8 players. Earn 50 VP per win.</p>
          </button>
          <button onClick={startAi} disabled={busy} className="rounded-2xl border border-white/10 bg-card p-6 text-left transition hover:bg-white/5 disabled:opacity-50">
            <Bot className="h-7 w-7 text-[#EF9F27]" />
            <div className="mt-3 font-display text-sm uppercase tracking-widest text-[#EF9F27]">Play vs AI</div>
            <h2 className="mt-1 text-xl font-bold">Solo Practice</h2>
            <p className="mt-1 text-xs text-muted-foreground">Instant match. Earn 10 VP per win.</p>
          </button>
        </div>
      </main>
    );
  }

  if (!match) return <main className="grid h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>;

  const planetPlayers = players.filter(p => p.team === "planet").sort((a, b) => a.slot - b.slot);
  const humansPlayers = players.filter(p => p.team === "humans").sort((a, b) => a.slot - b.slot);
  const planetPct = Math.min(100, match.planet_score);
  const humansPct = Math.min(100, match.humans_score);
  const myAbilities = ABILITIES.filter(a => a.team === myTeam);
  const isMyTurn = match.status === "active" && match.current_team === myTeam;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Arena · {match.mode === "ai" ? "vs AI" : "4v4"}</div>
          <h1 className="text-xl font-bold">{match.status === "lobby" ? "Lobby" : match.status === "active" ? `Turn ${match.turn}` : "Match Complete"}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void leave()} disabled={busy}>Leave</Button>
      </header>

      {/* Scoreboard */}
      <section className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-display uppercase tracking-widest text-[#3c9b55]"><Globe2 className="h-4 w-4" />Planet</span>
          <span className="font-mono text-[#3c9b55]">{match.planet_score}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-background/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1d9e75] to-[#3c9b55] transition-all" style={{ width: `${planetPct}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-display uppercase tracking-widest text-[#9cc6f5]"><Users className="h-4 w-4" />Humans</span>
          <span className="font-mono text-[#9cc6f5]">{match.humans_score}</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-background/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#378ADD] to-[#88BFFF] transition-all" style={{ width: `${humansPct}%` }} />
        </div>
        {match.status === "active" && (
          <div className="mt-3 text-center text-xs font-display uppercase tracking-widest" style={{ color: match.current_team === "planet" ? "#3c9b55" : "#9cc6f5" }}>
            {isMyTurn ? "Your team's turn — strike!" : `${match.current_team === "planet" ? "Planet" : "Humans"}'s turn`}
          </div>
        )}
        {match.status === "complete" && (
          <div className="mt-4 text-center">
            <Trophy className="mx-auto h-8 w-8 text-[#EF9F27]" />
            <div className="mt-1 text-lg font-bold">{match.winner === myTeam ? "Victory!" : match.winner ? "Defeat" : "Match ended"}</div>
            <div className="text-xs text-muted-foreground">
              {match.winner === myTeam ? `+${match.mode === "ai" ? 10 : 50} Victory Points` : "No VP awarded"}
            </div>
          </div>
        )}
      </section>

      {/* Teams */}
      <section className="grid grid-cols-2 gap-3">
        <TeamPanel label="Planet" color="#3c9b55" players={planetPlayers} />
        <TeamPanel label="Humans" color="#9cc6f5" players={humansPlayers} />
      </section>

      {/* Lobby controls */}
      {match.status === "lobby" && (
        <section className="rounded-2xl border border-white/10 bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">Waiting for players — {players.length}/8 in lobby, {players.filter(p => p.is_ready).length} ready</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button onClick={() => void ready(!me?.is_ready)} variant={me?.is_ready ? "outline" : "default"}>
              {me?.is_ready ? "Unready" : "Ready Up"}
            </Button>
          </div>
        </section>
      )}

      {/* Ability picker */}
      {match.status === "active" && myTeam && (
        <section className="rounded-2xl border border-white/10 bg-card p-4">
          <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">{myTeam === "planet" ? "Planetary Powers" : "Human Tech"}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {myAbilities.map(a => (
              <button
                key={a.slug}
                onClick={() => void playAbility(a.slug, a.dmg)}
                disabled={!isMyTurn || busy}
                className="rounded-xl border border-white/10 bg-background/60 p-3 text-left transition hover:border-white/30 disabled:opacity-40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{a.name}</span>
                  <Swords className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">+{a.dmg} dmg</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Action feed */}
      {actions.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-card p-4">
          <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">Battle Feed</h3>
          <div ref={feedRef} className="mt-2 max-h-48 overflow-y-auto space-y-1 text-xs">
            {actions.map(a => (
              <div key={a.id} className="flex items-center justify-between border-b border-white/5 py-1">
                <span><span className="font-semibold" style={{ color: a.team === "planet" ? "#3c9b55" : "#9cc6f5" }}>{a.display_name || "operator"}</span> · {ABILITIES.find(x => x.slug === a.ability_slug)?.name || a.ability_slug}</span>
                <span className="font-mono text-[#EF9F27]">+{a.damage}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function TeamPanel({ label, color, players }: { label: string; color: string; players: Player[] }) {
  const slots = [1, 2, 3, 4];
  return (
    <div className="rounded-xl border border-white/10 bg-background/60 p-3">
      <div className="font-display text-[10px] uppercase tracking-widest" style={{ color }}>{label}</div>
      <ul className="mt-2 space-y-1">
        {slots.map(slot => {
          const p = players.find(x => x.slot === slot);
          return (
            <li key={slot} className="flex items-center justify-between rounded border border-white/5 bg-background px-2 py-1 text-xs">
              {p ? (
                <>
                  <span className="truncate">{p.display_name || p.username || "operator"}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{p.country || "—"} {p.is_ready && "✓"}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Slot {slot}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
