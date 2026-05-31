import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CARDS } from "@/data/cards";
import { Dice5, Crown, Clock, Vote, Radio, ChevronRight, Play, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/board/$matchId")({
  component: BoardGame,
});

type Tile = { type: string; name: string; cost?: number; rent?: number; reward?: number; amount?: number; penalty?: number; stakes?: number };

const CORNERS: Record<number, Tile> = {
  0:  { type: "start",  name: "Gates of Heliopolis", reward: 200 },
  10: { type: "jail",   name: "Sanctuary of Anubis" },
  20: { type: "reward", name: "Oasis of Ra", reward: 300 },
  30: { type: "arena",  name: "Arena of Set", penalty: 150 },
};
const SPECIALS: Record<number, Tile> = {
  5:  { type: "pack",   name: "Tomb Cache" },
  9:  { type: "chance", name: "Whisper of Thoth" },
  14: { type: "battle", name: "Falcon Duel", stakes: 120 },
  18: { type: "chance", name: "Eye of Horus" },
  24: { type: "pack",   name: "Hidden Reliquary" },
  28: { type: "chance", name: "Sandstorm Omen" },
  34: { type: "tax",    name: "Pharaoh's Tribute", amount: 100 },
  38: { type: "chance", name: "Scarab's Riddle" },
};
const PROPS: [string, number][] = [
  ["Nile Banks",60],["Papyrus Fields",60],["Karnak Quarter",100],["Luxor Bazaar",100],
  ["Memphis Temple",120],["Giza Plateau",140],["Saqqara Necropolis",140],["Abydos Hall",160],
  ["Thebes Forum",180],["Edfu Sanctum",180],["Dendera Vault",200],["Aswan Quarry",220],
  ["Philae Isle",220],["Kom Ombo",240],["Alexandria Port",260],["Pharos Lighthouse",260],
  ["Catacombs",280],["Valley of Kings",300],["Valley of Queens",300],["Hatshepsut Causeway",320],
  ["Ramesseum",350],["Abu Simbel",350],["Temple of Isis",400],["Pyramid of Khufu",450],
];
function getTile(pos: number): Tile {
  if (CORNERS[pos]) return CORNERS[pos];
  if (SPECIALS[pos]) return SPECIALS[pos];
  let idx = 0;
  for (let p = 1; p < pos; p++) {
    if (!CORNERS[p] && !SPECIALS[p]) idx++;
  }
  const entry = PROPS[idx];
  if (!entry) return { type: "property", name: "Ruined Shrine", cost: 60, rent: 8 };
  return { type: "property", name: entry[0], cost: entry[1], rent: Math.round(entry[1] * 0.1) };
}

function gridPos(pos: number): { row: number; col: number } {
  if (pos <= 10) return { row: 11, col: 11 - pos };
  if (pos <= 20) return { row: 11 - (pos - 10), col: 1 };
  if (pos <= 30) return { row: 1, col: 1 + (pos - 20) };
  return { row: 1 + (pos - 30), col: 11 };
}

const SEAT_COLORS = ["bg-amber-500", "bg-sky-500", "bg-emerald-500", "bg-rose-500"];

interface Match {
  id: string; name: string; status: string; mode: string; max_players: number;
  host_id: string; current_seat: number | null; turn_number: number;
  turn_deadline: string | null; winner_user_id: string | null;
}
interface Player {
  id: string; user_id: string; seat: number; display_name: string | null;
  position: number; exod_in_game: number; score: number; is_eliminated: boolean;
  jail_turns: number; selected_card_id: string | null; selected_card_name: string | null;
  selected_card_rarity: string | null;
}
interface Claim {
  id: string; position: number; owner_player_id: string;
  card_name: string; card_rarity: string; level: number;
}
interface Move { id: string; turn_number: number; action: string; details: any; created_at: string; player_id: string | null; dice1: number | null; dice2: number | null; from_pos: number | null; to_pos: number | null; }
interface VoteRow { id: string; kind: string; status: string; yes_count: number; no_count: number; target_player_id: string | null; proposer_id: string; created_at: string; expires_at: string; }

function BoardGame() {
  const { matchId } = Route.useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<any>(null);

  const me = useMemo(() => players.find(p => p.user_id === user?.id) ?? null, [players, user?.id]);
  const isMyTurn = !!(me && match && match.current_seat === me.seat && match.status === "active");
  const eligibleCards = useMemo(
    () => CARDS.filter(c => !c.ownerOnly && c.rarity !== "Legendary" && c.rarity !== "Exodius"),
    []
  );

  async function loadAll() {
    const [{ data: m }, { data: ps }, { data: cs }, { data: ms }, { data: vs }] = await Promise.all([
      supabase.from("board_matches").select("*").eq("id", matchId).maybeSingle(),
      supabase.from("board_players").select("*").eq("match_id", matchId).order("seat"),
      supabase.from("board_property_claims").select("*").eq("match_id", matchId),
      supabase.from("board_moves").select("*").eq("match_id", matchId).order("created_at", { ascending: false }).limit(40),
      supabase.from("board_votes").select("*").eq("match_id", matchId).order("created_at", { ascending: false }).limit(10),
    ]);
    setMatch(m as any);
    setPlayers((ps ?? []) as any);
    setClaims((cs ?? []) as any);
    setMoves((ms ?? []) as any);
    setVotes((vs ?? []) as any);
    const meRow = (ps ?? []).find((p: any) => p.user_id === user?.id);
    if (meRow?.selected_card_id) setSelectedCardId(meRow.selected_card_id);
  }

  useEffect(() => { loadAll(); }, [matchId, user?.id]);

  useEffect(() => {
    const ch = supabase.channel(`board_${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_matches", filter: `id=eq.${matchId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_players", filter: `match_id=eq.${matchId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_property_claims", filter: `match_id=eq.${matchId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_moves", filter: `match_id=eq.${matchId}` }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_votes", filter: `match_id=eq.${matchId}` }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function startMatch() {
    const { error } = await supabase.rpc("board_start_match", { _match_id: matchId });
    if (error) toast.error(error.message); else toast.success("Match started");
  }
  async function setModeRpc(newMode: "async" | "live") {
    const { error } = await supabase.rpc("board_set_mode", { _match_id: matchId, _mode: newMode });
    if (error) toast.error(error.message);
  }
  async function selectCard(cardId: string) {
    const card = CARDS.find(c => c.id === cardId);
    if (!card) return;
    setSelectedCardId(cardId);
    setShowCardPicker(false);
    const { error } = await supabase.rpc("board_select_card", {
      _match_id: matchId, _card_id: card.id, _card_name: card.name, _card_rarity: card.rarity,
    });
    if (error) toast.error(error.message);
    else toast.success(`Playing ${card.name}`);
  }
  async function roll() {
    if (!selectedCardId) { toast.error("Pick a card to move first"); setShowCardPicker(true); return; }
    setRolling(true);
    const card = CARDS.find(c => c.id === selectedCardId)!;
    const { data, error } = await supabase.rpc("board_roll", {
      _match_id: matchId, _card_id: card.id, _card_name: card.name, _card_rarity: card.rarity,
    });
    setRolling(false);
    if (error) { toast.error(error.message); return; }
    setLastRoll(data);
  }
  async function claim(buy: boolean) {
    const { error } = await supabase.rpc("board_claim", { _match_id: matchId, _buy: buy });
    if (error) toast.error(error.message);
    setLastRoll(null);
  }
  async function upgrade() {
    const { error } = await supabase.rpc("board_upgrade", { _match_id: matchId });
    if (error) toast.error(error.message);
    setLastRoll(null);
  }
  async function pass() {
    const { error } = await supabase.rpc("board_skip", { _match_id: matchId });
    if (error) toast.error(error.message);
    setLastRoll(null);
  }
  async function proposeEndVote() {
    const { error } = await supabase.rpc("board_propose_vote", { _match_id: matchId, _kind: "end_game", _target: undefined });
    if (error) toast.error(error.message); else toast.success("End-game vote opened");
  }
  async function castVote(voteId: string, agree: boolean) {
    const { error } = await supabase.rpc("board_cast_vote", { _vote_id: voteId, _agree: agree });
    if (error) toast.error(error.message);
  }

  if (!match) return <div className="container mx-auto p-10">Loading match…</div>;

  const currentPlayer = players.find(p => p.seat === match.current_seat);
  const openVote = votes.find(v => v.status === "open");

  return (
    <div className="container mx-auto px-3 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to="/board" className="text-xs text-muted-foreground hover:text-foreground">← All games</Link>
        <h1 className="font-display text-2xl text-gradient-gold">{match.name}</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{match.status}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{match.mode}</span>
        {match.turn_deadline && match.status === "active" && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> turn ends {formatDistanceToNow(new Date(match.turn_deadline), { addSuffix: true })}
          </span>
        )}
        {match.host_id === user?.id && match.status === "active" && (
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant={match.mode === "async" ? "default" : "outline"} onClick={() => setModeRpc("async")}>
              <Clock className="h-3 w-3 mr-1" />Async
            </Button>
            <Button size="sm" variant={match.mode === "live" ? "default" : "outline"} onClick={() => setModeRpc("live")}>
              <Radio className="h-3 w-3 mr-1" />Live
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-border/60 bg-card/30 p-2 overflow-x-auto">
          <div className="mx-auto grid aspect-square min-w-[640px] max-w-[820px]"
               style={{ gridTemplateColumns: "repeat(11,minmax(0,1fr))", gridTemplateRows: "repeat(11,minmax(0,1fr))" }}>
            {Array.from({ length: 40 }).map((_, pos) => {
              const t = getTile(pos);
              const gp = gridPos(pos);
              const claim = claims.find(c => c.position === pos);
              const owner = claim ? players.find(p => p.id === claim.owner_player_id) : null;
              const here = players.filter(p => p.position === pos && !p.is_eliminated);
              const isCorner = pos % 10 === 0;
              return (
                <div key={pos}
                  style={{ gridRow: gp.row, gridColumn: gp.col }}
                  className={`relative border border-border/40 bg-background/40 text-[9px] p-1 overflow-hidden ${
                    isCorner ? "bg-gold/10" :
                    t.type === "chance" ? "bg-violet-500/10" :
                    t.type === "pack" ? "bg-emerald-500/10" :
                    t.type === "battle" ? "bg-rose-500/10" :
                    t.type === "tax" ? "bg-amber-500/10" : ""
                  }`}>
                  <div className="font-display leading-tight truncate">{t.name}</div>
                  {t.type === "property" && (
                    <div className="text-[8px] text-muted-foreground">${t.cost}</div>
                  )}
                  {owner && (
                    <div className={`mt-0.5 h-1 w-full rounded ${SEAT_COLORS[owner.seat - 1]}`} />
                  )}
                  {claim && (
                    <div className="text-[8px] truncate" title={claim.card_name}>
                      {claim.card_name} L{claim.level}
                    </div>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                    {here.map(p => (
                      <div key={p.id} title={p.display_name ?? undefined}
                        className={`h-2 w-2 rounded-full ring-1 ring-background ${SEAT_COLORS[p.seat - 1]}`} />
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ gridRow: "3 / span 7", gridColumn: "3 / span 7" }}
                 className="flex flex-col items-center justify-center text-center p-4 border border-border/40 bg-background/20">
              {match.status === "lobby" ? (
                <>
                  <div className="text-lg font-display">Waiting for players…</div>
                  <div className="mt-2 text-sm text-muted-foreground">{players.length}/{match.max_players}</div>
                  {match.host_id === user?.id && (
                    <Button onClick={startMatch} disabled={players.length < 2} className="mt-4 bg-gold text-gold-foreground hover:bg-gold/90">
                      <Play className="h-4 w-4 mr-1" /> Start match
                    </Button>
                  )}
                </>
              ) : match.status === "completed" ? (
                <>
                  <Crown className="h-10 w-10 text-gold mb-2" />
                  <div className="font-display text-xl">Winner</div>
                  <div className="mt-1">{players.find(p => p.user_id === match.winner_user_id)?.display_name ?? "—"}</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">Turn {match.turn_number}</div>
                  <div className="mt-1 font-display text-lg">{currentPlayer?.display_name}'s move</div>
                  {lastRoll && (
                    <div className="mt-3 text-xs">
                      Rolled {lastRoll.dice?.[0]}+{lastRoll.dice?.[1]} → {getTile(lastRoll.to).name}
                      <div className="mt-1 text-muted-foreground">{lastRoll.outcome}</div>
                    </div>
                  )}
                  {isMyTurn && (
                    <div className="mt-4 flex flex-col gap-2 w-full max-w-[220px]">
                      {!lastRoll || !["can_claim","own_property"].includes(lastRoll.outcome) ? (
                        <>
                          <Button onClick={() => setShowCardPicker(true)} variant="outline" size="sm">
                            {selectedCardId ? CARDS.find(c => c.id === selectedCardId)?.name : "Pick card to move"}
                          </Button>
                          <Button onClick={roll} disabled={rolling || !selectedCardId} className="bg-gold text-gold-foreground hover:bg-gold/90">
                            <Dice5 className="h-4 w-4 mr-1" /> {rolling ? "Rolling…" : "Roll dice"}
                          </Button>
                        </>
                      ) : lastRoll.outcome === "can_claim" ? (
                        <>
                          <div className="text-xs">Buy for ${lastRoll.cost}?</div>
                          <Button onClick={() => claim(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">Claim with {me?.selected_card_name}</Button>
                          <Button onClick={() => claim(false)} variant="outline">Skip</Button>
                        </>
                      ) : (
                        <>
                          {lastRoll.can_upgrade && (
                            <Button onClick={upgrade} className="bg-gold text-gold-foreground hover:bg-gold/90">Upgrade (+ rent)</Button>
                          )}
                          <Button onClick={pass} variant="outline">End turn</Button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-card/40 p-3">
            <div className="font-display text-sm mb-2">Players</div>
            {players.map(p => (
              <div key={p.id} className={`flex items-center gap-2 py-1 text-xs ${match.current_seat === p.seat ? "font-bold" : ""}`}>
                <div className={`h-3 w-3 rounded-full ${SEAT_COLORS[p.seat - 1]}`} />
                <div className="flex-1 truncate">{p.display_name}{p.user_id === user?.id ? " (you)" : ""}</div>
                <div className="text-muted-foreground">${Math.round(Number(p.exod_in_game))}</div>
                <div className="text-gold">{Math.round(Number(p.score))}pt</div>
                {p.is_eliminated && <X className="h-3 w-3 text-rose-500" />}
              </div>
            ))}
          </div>

          {openVote && me && (
            <div className="rounded-lg border border-gold/60 bg-gold/5 p-3">
              <div className="font-display text-sm mb-1 flex items-center gap-1">
                <Vote className="h-4 w-4" /> {openVote.kind === "end_game" ? "End the game?" : "Skip player?"}
              </div>
              <div className="text-xs text-muted-foreground">Yes: {openVote.yes_count} · No: {openVote.no_count}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => castVote(openVote.id, true)}>Yes</Button>
                <Button size="sm" variant="outline" onClick={() => castVote(openVote.id, false)}>No</Button>
              </div>
            </div>
          )}

          {match.status === "active" && me && !openVote && (
            <Button variant="outline" className="w-full" onClick={proposeEndVote}>
              <Vote className="h-4 w-4 mr-1" /> Call vote to end & score
            </Button>
          )}

          <div className="rounded-lg border border-border/60 bg-card/40 p-3 max-h-[420px] overflow-y-auto">
            <div className="font-display text-sm mb-2">Timeline</div>
            {moves.map(mv => {
              const p = players.find(pp => pp.id === mv.player_id);
              return (
                <div key={mv.id} className="text-[11px] py-1 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-1">
                    {p && <div className={`h-2 w-2 rounded-full ${SEAT_COLORS[p.seat - 1]}`} />}
                    <span className="font-medium">{p?.display_name ?? "system"}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{mv.action}</span>
                  </div>
                  {mv.dice1 != null && (
                    <div className="text-muted-foreground">
                      🎲 {mv.dice1}+{mv.dice2} → {getTile(mv.to_pos ?? 0).name} ({mv.details?.outcome})
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(mv.created_at), { addSuffix: true })}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCardPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur p-4" onClick={() => setShowCardPicker(false)}>
          <div className="max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-lg border border-border/60 bg-card p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg">Pick a card to move</h3>
              <button onClick={() => setShowCardPicker(false)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Legendary and Exodia cards can't claim properties — pick from Common, Rare, or Divine.</p>
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
              {eligibleCards.map(c => (
                <button key={c.id} onClick={() => selectCard(c.id)}
                  className={`rounded border bg-background/60 p-2 text-left text-xs hover:border-gold/60 transition ${selectedCardId === c.id ? "border-gold" : "border-border/60"}`}>
                  <img src={c.art} alt="" className="w-full aspect-[3/4] object-cover rounded mb-1" />
                  <div className="font-display truncate">{c.name}</div>
                  <div className="text-muted-foreground">{c.rarity}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
