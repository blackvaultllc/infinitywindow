import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dice5, Users, Clock, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "Pharaoh's Gambit — Board Game | Exodia" },
      { name: "description", content: "Roll dice, claim properties with your Exodia cards, win packs. Play live or async up to 4 players." },
    ],
  }),
  component: BoardLobby,
});

interface MatchRow {
  id: string; name: string; status: string; mode: string;
  max_players: number; host_id: string; created_at: string;
  player_count?: number;
}

function BoardLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [myMatches, setMyMatches] = useState<MatchRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Pharaoh's Gambit");
  const [mode, setMode] = useState<"async" | "live">("async");
  const [maxPlayers, setMaxPlayers] = useState(4);

  async function load() {
    const { data: lobbies } = await supabase
      .from("board_matches")
      .select("id,name,status,mode,max_players,host_id,created_at")
      .in("status", ["lobby", "active"])
      .order("created_at", { ascending: false })
      .limit(40);
    const list = (lobbies ?? []) as MatchRow[];
    if (list.length) {
      const { data: counts } = await supabase
        .from("board_players")
        .select("match_id")
        .in("match_id", list.map(m => m.id));
      const cmap = new Map<string, number>();
      (counts ?? []).forEach((r: any) => cmap.set(r.match_id, (cmap.get(r.match_id) ?? 0) + 1));
      list.forEach(m => { m.player_count = cmap.get(m.id) ?? 0; });
    }
    setMatches(list.filter(m => m.status === "lobby"));
    if (user) {
      const { data: mine } = await supabase
        .from("board_players")
        .select("match_id, board_matches(id,name,status,mode,max_players,host_id,created_at)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      const rows: MatchRow[] = [];
      (mine ?? []).forEach((r: any) => {
        if (r.board_matches && r.board_matches.status !== "completed") rows.push(r.board_matches);
      });
      setMyMatches(rows);
    }
  }

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    const ch = supabase.channel("board_lobbies")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_matches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function createMatch() {
    if (!user) { toast.error("Sign in to host a game"); return; }
    setCreating(true);
    const { data, error } = await supabase.rpc("board_create_match", {
      _mode: mode, _max_players: maxPlayers, _name: name,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lobby created");
    navigate({ to: "/board/$matchId", params: { matchId: data as string } });
  }

  async function joinMatch(id: string) {
    if (!user) { toast.error("Sign in to join"); return; }
    const { error } = await supabase.rpc("board_join_match", { _match_id: id });
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/board/$matchId", params: { matchId: id } });
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-gradient-gold">Pharaoh's Gambit</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          A Monopoly-style board for your Exodia cards. Roll, move, claim Egyptian properties with the
          card in your hand, and outscore your rivals. Play live or leave moves overnight — async turn
          deadline is 24 hours. Winner gets one free pack (Common→Divine pool, never Legendary).
        </p>
      </div>

      {myMatches.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3">Your active games</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myMatches.map(m => (
              <Link key={m.id} to="/board/$matchId" params={{ matchId: m.id }}
                className="rounded-lg border border-border/60 bg-card/60 p-4 hover:border-gold/60 transition">
                <div className="flex items-center justify-between">
                  <div className="font-display text-base">{m.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{m.status}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.max_players} max</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {m.mode}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10 rounded-lg border border-border/60 bg-card/40 p-5">
        <h2 className="font-display text-xl mb-3 flex items-center gap-2"><Crown className="h-5 w-5 text-gold" /> Host a new lobby</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Game name" />
          <select value={mode} onChange={e => setMode(e.target.value as any)}
            className="rounded-md border border-border/60 bg-background px-3 text-sm">
            <option value="async">Async (24h turns)</option>
            <option value="live">Live (real-time)</option>
          </select>
          <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}
            className="rounded-md border border-border/60 bg-background px-3 text-sm">
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
          <Button onClick={createMatch} disabled={creating || !user}
            className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Dice5 className="h-4 w-4 mr-1" /> Create lobby
          </Button>
        </div>
        {!user && <p className="mt-2 text-xs text-muted-foreground">Sign in to host or join games.</p>}
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Open lobbies</h2>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open lobbies. Be the first to host.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map(m => (
              <div key={m.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-display text-base">{m.name}</div>
                  <span className="text-xs text-muted-foreground">{m.mode}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {m.player_count ?? 0}/{m.max_players} players
                </div>
                <Button onClick={() => joinMatch(m.id)} disabled={!user || (m.player_count ?? 0) >= m.max_players}
                  className="mt-3 w-full" variant="outline">
                  {m.host_id === user?.id ? "Open lobby" : "Join"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
