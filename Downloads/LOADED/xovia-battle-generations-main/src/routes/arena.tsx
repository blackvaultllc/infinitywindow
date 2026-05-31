import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CARDS, type Card } from "@/data/cards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArenaLobby } from "@/components/ArenaLobby";

export const Route = createFileRoute("/arena")({
  component: ArenaPage,
  head: () => ({
    meta: [
      { title: "Battle Arena — Duel for Divinity" },
      { name: "description", content: "Vertical duel mat in the classic style. Draw, summon, battle, end — assemble Exodia Prime for an instant win." },
      { property: "og:title", content: "Battle Arena — Exodia NFT Battle" },
      { property: "og:description", content: "Interactive Egyptian card duels with on-chain stakes." },
      { property: "og:url", content: "/arena" },
    ],
    links: [{ rel: "canonical", href: "/arena" }],
  }),
});

const PHASES = ["Draw", "Summon", "Battle", "End"] as const;
type Phase = (typeof PHASES)[number];

const FIELD_SLOTS = 5;
const ST_SLOTS = 5;

// Card "level" derived from rarity. Higher levels require tributes.
function cardLevel(c: Card): number {
  switch (c.rarity) {
    case "Exodius": return 5;
    case "Legendary": return 4;
    case "Divine": return 3;
    case "Rare": return 2;
    default: return 1;
  }
}
function tributesRequired(c: Card): number {
  const lv = cardLevel(c);
  if (lv >= 5) return 2;
  if (lv >= 3) return 1;
  return 0;
}
function isSpellOrTrap(c: Card): boolean {
  return c.type === "Spell" || c.type === "Trap";
}

interface Combatant {
  name: string;
  lp: number;
  hand: Card[];
  field: (Card | null)[]; // 5 monster slots
  spellTrap: (Card | null)[]; // 5 spell/trap slots (visual reserve)
  graveyard: Card[];
  deckCount: number;
}

function pickStartingHand(rng: () => number, exclude: Set<string>, n = 5): Card[] {
  const pool = CARDS.filter((c) => c.rarity !== "Exodius" && !exclude.has(c.id));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function ArenaPage() {
  const [you, setYou] = useState<Combatant>(() => ({
    name: "You",
    lp: 8000,
    hand: pickStartingHand(Math.random, new Set(), 7),
    field: Array(FIELD_SLOTS).fill(null),
    spellTrap: Array(ST_SLOTS).fill(null),
    graveyard: [],
    deckCount: 35,
  }));
  const [opp, setOpp] = useState<Combatant>(() => {
    const f: (Card | null)[] = Array(FIELD_SLOTS).fill(null);
    f[1] = CARDS.find((c) => c.id === "anubis") ?? null;
    f[2] = CARDS.find((c) => c.id === "set") ?? null;
    return {
      name: "Akhenaten·Adept",
      lp: 8000,
      hand: pickStartingHand(Math.random, new Set(), 4),
      field: f,
      spellTrap: Array(ST_SLOTS).fill(null),
      graveyard: [],
      deckCount: 35,
    };
  });
  const [phase, setPhase] = useState<Phase>("Draw");
  const [log, setLog] = useState<string[]>(["The sands are still. The duel begins."]);
  const [selected, setSelected] = useState<string | null>(null);
  const [turn, setTurn] = useState<"you" | "opp">("you");
  const [normalSummonsLeft, setNormalSummonsLeft] = useState(1);
  const [pendingTribute, setPendingTribute] = useState<{ card: Card; needed: number; chosen: number[] } | null>(null);
  const [heavensRoundsLeft, setHeavensRoundsLeft] = useState(0);
  const [signupCount, setSignupCount] = useState<number | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [clash, setClash] = useState<{ id: number; kind: "hit" | "poison" | "direct" } | null>(null);
  const clashId = useRef(0);
  const triggerClash = (kind: "hit" | "poison" | "direct") => {
    clashId.current += 1;
    const id = clashId.current;
    setClash({ id, kind });
    setTimeout(() => setClash((c) => (c && c.id === id ? null : c)), 700);
  };

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setSignupCount(count ?? 0));
  }, []);

  function maybeDropHeavens(youLp: number, oppLp: number) {
    if (heavensRoundsLeft > 0) return;
    const count = signupCount ?? 999;
    const base = count <= 30 ? 0.08 : 0.0001;
    const nearDeath = youLp < 2000 || oppLp < 2000;
    const chance = nearDeath ? Math.max(base, count <= 30 ? 0.25 : 0.02) : base;
    if (Math.random() < chance) {
      setHeavensRoundsLeft(3);
      appendLog("✦ THE CARD FROM THE HEAVENS DESCENDS — no damage may be dealt for 3 rounds.");
      toast("The Card from the Heavens descends", {
        description: "Both duelists may draw and set, but no attacks land for 3 rounds.",
      });
    }
  }

  const appendLog = (s: string) => setLog((l) => [s, ...l].slice(0, 60));

  const advancePhase = () => {
    if (turn !== "you") {
      toast("Opponent's turn — wait for their move.");
      return;
    }
    if (pendingTribute) {
      toast("Finish or cancel the tribute first.");
      return;
    }
    const idx = PHASES.indexOf(phase);
    if (phase === "End") {
      // End of your turn — pass control to opponent.
      appendLog("— You end your turn.");
      setTurn("opp");
      setPhase("Draw");
      setHeavensRoundsLeft((n) => Math.max(0, n - 1));
      setTimeout(() => {
        opponentTurn();
        maybeDropHeavens(you.lp, opp.lp);
        // Hand control back to you, start fresh turn
        setTimeout(() => {
          setTurn("you");
          setNormalSummonsLeft(1);
          setPhase("Draw");
          drawForYou();
          appendLog("— Your turn. Draw phase.");
        }, 900);
      }, 250);
      return;
    }
    const next = PHASES[idx + 1];
    setPhase(next);
    appendLog(`— Phase: ${next}.`);
  };

  const drawForYou = () => {
    setYou((p) => {
      const remaining = CARDS.filter(
        (c) => c.rarity !== "Exodius" && !p.hand.find((h) => h.id === c.id) && !p.field.find((f) => f?.id === c.id),
      );
      const draw = remaining[Math.floor(Math.random() * remaining.length)];
      if (!draw) return p;
      appendLog(`You draw ${draw.name}.`);
      return { ...p, hand: [...p.hand, draw], deckCount: Math.max(0, p.deckCount - 1) };
    });
  };

  const placeSpellTrap = (card: Card) => {
    const slot = you.spellTrap.findIndex((s) => s === null);
    if (slot === -1) { toast("Your spell/trap row is full."); return; }
    setYou((p) => {
      const st = [...p.spellTrap];
      st[slot] = card;
      return { ...p, hand: p.hand.filter((h) => h.id !== card.id), spellTrap: st };
    });
    appendLog(`You set ${card.type === "Trap" ? "a trap" : "a spell"} face-down (slot ${slot + 1}).`);
  };

  const completeMonsterSummon = (card: Card, tributeSlots: number[] = []) => {
    const slot = you.field.findIndex((s, i) => s === null && !tributeSlots.includes(i));
    if (slot === -1) { toast("Your field is full."); return; }
    setYou((p) => {
      const field = [...p.field];
      const grave = [...p.graveyard];
      for (const ti of tributeSlots) {
        const t = field[ti];
        if (t) { grave.push(t); field[ti] = null; }
      }
      field[slot] = card;
      return {
        ...p,
        hand: p.hand.filter((h) => h.id !== card.id),
        field,
        graveyard: grave,
      };
    });
    setNormalSummonsLeft((n) => n - 1);
    const tribLog = tributeSlots.length ? ` (tributing ${tributeSlots.length})` : "";
    appendLog(`You summon ${card.name} [Lv${cardLevel(card)}] to slot ${slot + 1}${tribLog}.`);
    const exodiusOnField = [...you.field, card].filter((c) => c && c.rarity === "Exodius") as Card[];
    if (exodiusOnField.length >= 5) {
      appendLog(`THE FORBIDDEN ONE IS ASSEMBLED. The duel ends.`);
      setOpp((o) => ({ ...o, lp: 0 }));
      toast("Exodia Prime is whole. You win.", { description: "All five relics on your field." });
    }
  };

  const playFromHand = (card: Card) => {
    if (turn !== "you") { toast("Wait for your turn."); return; }
    if (phase !== "Summon") { toast("Switch to the Summon phase to play cards."); return; }
    if (isSpellOrTrap(card)) {
      placeSpellTrap(card);
      return;
    }
    if (normalSummonsLeft <= 0) {
      toast("Only one normal summon per turn.", { description: "End the turn or tribute for a high-level monster." });
      return;
    }
    const needed = tributesRequired(card);
    if (needed === 0) {
      completeMonsterSummon(card, []);
      return;
    }
    const onField = you.field.filter((c) => c !== null).length;
    if (onField < needed) {
      toast(`Need ${needed} tribute${needed > 1 ? "s" : ""} on the field.`, {
        description: `${card.name} is Lv${cardLevel(card)}.`,
      });
      return;
    }
    setPendingTribute({ card, needed, chosen: [] });
    appendLog(`Select ${needed} monster${needed > 1 ? "s" : ""} to tribute for ${card.name}.`);
    toast(`Tribute required`, { description: `Click ${needed} of your monsters to send to the graveyard.` });
  };

  const tributeClick = (slot: number) => {
    if (!pendingTribute) return;
    if (you.field[slot] === null) return;
    if (pendingTribute.chosen.includes(slot)) {
      setPendingTribute({ ...pendingTribute, chosen: pendingTribute.chosen.filter((s) => s !== slot) });
      return;
    }
    const chosen = [...pendingTribute.chosen, slot];
    if (chosen.length >= pendingTribute.needed) {
      const card = pendingTribute.card;
      setPendingTribute(null);
      completeMonsterSummon(card, chosen);
    } else {
      setPendingTribute({ ...pendingTribute, chosen });
    }
  };

  const attack = (attackerSlot: number) => {
    if (pendingTribute) { tributeClick(attackerSlot); return; }
    if (turn !== "you") { toast("Wait for your turn."); return; }
    if (phase !== "Battle") {
      toast("Switch to the Battle phase first.");
      return;
    }
    if (heavensRoundsLeft > 0) {
      toast("Attacks are sealed", {
        description: `The Card from the Heavens silences combat for ${heavensRoundsLeft} more round${heavensRoundsLeft === 1 ? "" : "s"}.`,
      });
      appendLog(`The Heavens stay your blade — ${heavensRoundsLeft} round${heavensRoundsLeft === 1 ? "" : "s"} remaining.`);
      return;
    }
    const attacker = you.field[attackerSlot];
    if (!attacker) return;
    const targetSlot = opp.field.findIndex((c) => c !== null);
    if (targetSlot === -1) {
      const dmg = attacker.atk;
      setOpp((o) => ({ ...o, lp: Math.max(0, o.lp - dmg) }));
      appendLog(`${attacker.name} attacks directly for ${dmg}.`);
      triggerClash("direct");
      return;
    }
    const target = opp.field[targetSlot]!;
    const dmg = Math.max(0, attacker.atk - target.def);
    appendLog(`${attacker.name} strikes ${target.name}. ${dmg > 0 ? `Defender falls (-${dmg} LP).` : "Defender holds."}`);
    triggerClash(dmg > 0 ? "hit" : "poison");
    if (dmg > 0) {
      setOpp((o) => {
        const field = [...o.field];
        const fallen = field[targetSlot]!;
        field[targetSlot] = null;
        return { ...o, field, graveyard: [...o.graveyard, fallen], lp: Math.max(0, o.lp - dmg) };
      });
    }
  };

  const opponentTurn = () => {
    setOpp((p) => {
      const field = [...p.field];
      const openSlot = field.findIndex((s) => s === null);
      let hand = p.hand;
      if (openSlot !== -1 && hand.length) {
        const card = hand[0];
        field[openSlot] = card;
        hand = hand.slice(1);
        appendLog(`Opponent summons ${card.name}.`);
      }
      return { ...p, field, hand };
    });
    setTimeout(() => {
      if (heavensRoundsLeft > 0) {
        appendLog("Opponent's attack is sealed by the Heavens.");
        return;
      }
      setOpp((oState) => {
        const attacker = oState.field.find((c) => c) ?? null;
        if (!attacker) return oState;
        setYou((yState) => {
          const targetIdx = yState.field.findIndex((c) => c !== null);
          if (targetIdx === -1) {
            const dmg = Math.floor(attacker.atk * 0.5);
            appendLog(`Opponent's ${attacker.name} strikes you directly for ${dmg}.`);
            return { ...yState, lp: Math.max(0, yState.lp - dmg) };
          }
          const target = yState.field[targetIdx]!;
          const dmg = Math.max(0, attacker.atk - target.def);
          if (dmg > 0) {
            appendLog(`Opponent's ${attacker.name} destroys your ${target.name} (-${dmg} LP).`);
            const field = [...yState.field];
            const fallen = field[targetIdx]!;
            field[targetIdx] = null;
            return { ...yState, field, graveyard: [...yState.graveyard, fallen], lp: Math.max(0, yState.lp - dmg) };
          }
          appendLog(`Opponent's ${attacker.name} bounces off your ${target.name}.`);
          return yState;
        });
        return oState;
      });
    }, 400);
  };

  const winner = useMemo(() => {
    if (you.lp <= 0) return "opponent";
    if (opp.lp <= 0) return "you";
    return null;
  }, [you.lp, opp.lp]);

  const { user } = useAuth();
  const awardedRef = useRef(false);
  useEffect(() => {
    if (!winner || !user || awardedRef.current) return;
    awardedRef.current = true;
    const won = winner === "you";
    supabase.rpc("award_battle_xp", { _won: won }).then(({ data, error }) => {
      if (error) {
        toast.error("Could not save battle result", { description: error.message });
        return;
      }
      const r = data as { xp: number; level: number; leveled_up: boolean; levels_gained: number; pending_free_packs: number; unlocked: string[] } | null;
      if (!r) return;
      appendLog(`+${won ? 50 : 15} XP · Total ${r.xp} (Lv ${r.level})`);
      if (r.leveled_up) {
        toast.success(`Level up! You reached Lv ${r.level}`, {
          description: `+${250 * r.levels_gained} EXOD and +${r.levels_gained} free pack credit. Open it in Drops.`,
        });
        appendLog(`★ LEVEL UP — Lv ${r.level}. +${r.levels_gained} free pack queued.`);
      } else {
        toast(won ? "Victory recorded — +50 XP" : "Defeat recorded — +15 XP");
      }
      if (r.unlocked && r.unlocked.length > 0) {
        for (const a of r.unlocked) {
          toast.success("Achievement unlocked!", { description: a.replace(/_/g, " ") });
          appendLog(`🏆 Achievement unlocked: ${a.replace(/_/g, " ")}`);
        }
      }
    });
  }, [winner, user]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="w-full px-3 pt-4 pb-2 md:px-6">
        <ArenaLobby />

        {/* Top bar: title + phase + actions */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/30 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-crimson">Sands of Judgment</div>
              <h1 className="font-display text-xl md:text-2xl text-gradient-gold leading-none">Battle Arena</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 p-1">
            {PHASES.map((p, i) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.25em] transition",
                  phase === p
                    ? "bg-gold/20 text-gold ring-1 ring-gold/60 glow-gold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {i + 1}. {p}
              </button>
            ))}
            <Button
              size="sm"
              onClick={advancePhase}
              disabled={turn !== "you" || !!pendingTribute}
              className={cn(
                "ml-1 h-7",
                phase === "End"
                  ? "bg-crimson text-foreground hover:bg-crimson/90"
                  : "bg-gold text-gold-foreground hover:bg-gold/90",
              )}
            >
              {phase === "End" ? "End Turn ⟳" : "Next →"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border/70"
              onClick={() => toast("Spectator mode coming in Phase 5.", { description: "Watch live public duels with chat." })}
            >Spectate</Button>
            <Button
              size="sm"
              className="bg-crimson text-foreground hover:bg-crimson/90"
              onClick={() => toast("Matchmaking ships in Phase 2 with auth.")}
            >Find PvP Duel</Button>
          </div>
        </div>

        {/* Turn indicator + tribute prompt */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
          <span className={cn("rounded-full border px-3 py-1", turn === "you" ? "border-gold/60 bg-gold/10 text-gold" : "border-crimson/60 bg-crimson/10 text-crimson")}>
            {turn === "you" ? "Your turn" : "Opponent's turn"}
          </span>
          <span className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-muted-foreground">
            Normal summon: {normalSummonsLeft}/1
          </span>
          {pendingTribute && (
            <span className="flex items-center gap-2 rounded-full border border-crimson/60 bg-crimson/10 px-3 py-1 text-crimson">
              Tribute {pendingTribute.chosen.length}/{pendingTribute.needed} for {pendingTribute.card.name}
              <button onClick={() => { setPendingTribute(null); appendLog("Tribute canceled."); }} className="text-[10px] underline">cancel</button>
            </span>
          )}
        </div>

        <AnimatePresence>
          {heavensRoundsLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 flex items-center gap-3 rounded-lg border border-accent/60 bg-gradient-to-r from-accent/10 via-gold/10 to-accent/10 p-2.5"
            >
              <div className="font-display text-xl text-gold">✦</div>
              <div className="text-xs">
                <span className="text-accent uppercase tracking-[0.2em]">Card from the Heavens</span>{" "}
                <span className="text-muted-foreground">— attacks sealed for {heavensRoundsLeft} round{heavensRoundsLeft === 1 ? "" : "s"}.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main layout: board + log sidebar */}
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          {/* DUEL MAT */}
          <div className="relative overflow-hidden rounded-xl border border-gold/40 bg-card/70 hieroglyph-bg shadow-[0_0_60px_-20px_rgba(201,168,76,0.4)]">
            <div className="flex flex-col justify-between gap-1" style={{ height: "min(78vh, 760px)", minHeight: "520px" }}>
              {/* Opponent face-down hand */}
              <div className="flex justify-center gap-1 px-4 pt-2">
                {Array.from({ length: Math.min(opp.hand.length + 4, 7) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-10 rounded-sm border border-gold/40 bg-gradient-to-br from-background to-card/80 shadow-md md:h-7 md:w-12"
                  >
                    <div className="flex h-full items-center justify-center font-display text-[10px] text-gold/70">𓂀</div>
                  </div>
                ))}
              </div>

              {/* Opponent info bar */}
              <PlayerBar combatant={opp} label="AKHENATEN·ADEPT" sublabel="Adept · Rank Bronze" side="top" />

              {/* Opponent back row: Field Spell | 5 S/T | Extra Deck */}
              <FieldRow
                left={<CornerZone label="Field" tone="green" />}
                right={<CornerZone label="Extra" tone="purple" count={opp.field.length ? 15 : 15} />}
                center={<ZoneRow zones={opp.spellTrap} variant="st" facedown />}
              />

              {/* Opponent front row: Graveyard | 5 Monster | Deck */}
              <FieldRow
                left={<CornerZone label="Grave" tone="gray" count={opp.graveyard.length} stacked />}
                right={<CornerZone label="Deck" tone="purple" count={Math.max(0, 40 - opp.hand.length - opp.field.length - opp.graveyard.length)} stacked />}
                center={
                  <MonsterRow
                    cards={opp.field}
                    isYou={false}
                    phase={phase}
                    onAttack={() => {}}
                  />
                }
              />

              {/* NEUTRAL CENTER — seal flanking 2 shared Extra Monster Zones */}
              <SealCenter clash={clash} turn={turn} phase={phase} />

              {/* Player front row: Deck | 5 Monster | Graveyard */}
              <FieldRow
                left={<CornerZone label="Deck" tone="purple" count={Math.max(0, 40 - you.hand.length - you.field.length - you.graveyard.length)} stacked />}
                right={<CornerZone label="Grave" tone="gray" count={you.graveyard.length} stacked />}
                center={
                  <MonsterRow
                    cards={you.field}
                    isYou
                    phase={phase}
                    onAttack={attack}
                    highlightSlots={pendingTribute?.chosen ?? []}
                    selectable={!!pendingTribute}
                  />
                }
              />

              {/* Player back row: Extra Deck | 5 S/T | Field Spell */}
              <FieldRow
                left={<CornerZone label="Extra" tone="purple" count={15} />}
                right={<CornerZone label="Field" tone="green" />}
                center={<ZoneRow zones={you.spellTrap} variant="st" />}
              />

              {/* Player info bar */}
              <PlayerBar combatant={you} label="YOU · DUELIST" sublabel="Rank Bronze" side="bottom" />
            </div>

            {winner && (
              <div className="absolute inset-x-6 bottom-4 rounded-md border border-gold/60 bg-background/90 p-3 text-center font-display text-lg text-gradient-gold backdrop-blur">
                {winner === "you" ? "Victory. The dynasty bends." : "Defeat. The sands close over you."}
              </div>
            )}
          </div>

          {/* COMBAT LOG */}
          <div className="hidden rounded-xl border border-border/60 bg-card/40 p-4 lg:block">
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Combat Log</div>
            <div className="max-h-[min(78vh,760px)] space-y-1.5 overflow-y-auto pr-1 text-xs">
              <AnimatePresence initial={false}>
                {log.map((line, i) => (
                  <motion.div
                    key={`${line}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "border-l-2 pl-2",
                      i === 0 ? "border-gold/70 text-foreground" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* PLAYER HAND ROW */}
        <div className="mt-3 rounded-xl border border-gold/30 bg-card/60 p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Hand ({you.hand.length})</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{phase === "Summon" ? "Click a card to summon" : "Switch to Summon phase to play cards"}</div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
                {you.hand.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c.id);
                  playFromHand(c);
                }}
                className={cn(
                  "group relative h-[108px] w-[78px] shrink-0 overflow-hidden rounded transition md:h-[120px] md:w-[86px]",
                  `card-frame-${c.rarity}`,
                  phase === "Summon" && "hover:-translate-y-5 hover:ring-2 hover:ring-gold/80",
                  selected === c.id && "ring-2 ring-gold/80 -translate-y-3",
                )}
              >
                <img src={c.art} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-1">
                  <div className="truncate font-display text-[9px]">{c.name}</div>
                  <div className="text-[9px] text-gold">Lv{cardLevel(c)} · {c.atk}/{c.def}</div>
                  {isSpellOrTrap(c) && <div className="text-[8px] uppercase tracking-widest text-accent">{c.type}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile log toggle */}
        <div className="mt-3 lg:hidden">
          <Button variant="outline" size="sm" className="w-full border-gold/40" onClick={() => setLogOpen((v) => !v)}>
            {logOpen ? "Hide Combat Log" : "Show Combat Log"}
          </Button>
          {logOpen && (
            <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 bg-card/40 p-3 text-xs">
              {log.map((line, i) => (
                <div key={`${line}-${i}`} className={cn("border-l-2 pl-2", i === 0 ? "border-gold/70 text-foreground" : "border-border/60 text-muted-foreground")}>{line}</div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Local exhibition mode. Live PvP, spectator chat, and ranked matchmaking ship in Phase 2 with accounts.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ─── Subcomponents ─────────────────────────────────────── */

function PlayerBar({
  combatant, label, sublabel, side,
}: { combatant: Combatant; label: string; sublabel: string; side: "top" | "bottom" }) {
  const lpPct = Math.max(0, Math.min(100, (combatant.lp / 8000) * 100));
  const lpColor = side === "top" ? "from-accent via-gold to-accent" : "from-crimson via-gold to-crimson";
  return (
    <div className={cn("flex items-center justify-between gap-3 border-border/40 bg-background/40 px-4 py-2", side === "top" ? "border-b" : "border-t")}>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/80 to-crimson/80 ring-1 ring-gold/60" />
        <div>
          <div className="font-display text-sm text-gold leading-tight">{label}</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{sublabel}</div>
        </div>
      </div>
      <div className="flex-1 max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">LP</span>
          <span className="font-display text-base text-gold tabular-nums">{combatant.lp}</span>
        </div>
        <div className="h-2 overflow-hidden rounded bg-background/80 ring-1 ring-border/60">
          <div className={cn("h-full bg-gradient-to-r transition-all", lpColor)} style={{ width: `${lpPct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Deck</div>
          <div className="font-display text-xs text-gold tabular-nums">{combatant.deckCount}</div>
        </div>
        <div className="relative h-10 w-7 rounded-sm border border-gold/50 bg-gradient-to-br from-background to-card shadow-inner">
          <div className="flex h-full items-center justify-center font-display text-sm text-gold/70">𓂀</div>
        </div>
      </div>
    </div>
  );
}

function CenterDivider({ clash }: { clash: { id: number; kind: "hit" | "poison" | "direct" } | null }) {
  return (
    <div className="relative my-2 flex items-center justify-center">
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent"
        style={{ boxShadow: "0 0 12px rgba(201,168,76,0.6)" }}
      />
      <div className="absolute inset-x-0 flex items-center justify-center">
        <span className="rounded-full border border-gold/60 bg-background/80 px-3 py-0.5 font-display text-[10px] uppercase tracking-[0.4em] text-gold backdrop-blur">
          ✦ XOVIA ✦
        </span>
      </div>
      <AnimatePresence>
        {clash && (
          <motion.div
            key={clash.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1.6 }}
            exit={{ opacity: 0, scale: 2.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "pointer-events-none absolute h-24 w-24 rounded-full blur-xl",
              clash.kind === "hit" && "bg-crimson/70",
              clash.kind === "direct" && "bg-gold/70",
              clash.kind === "poison" && "bg-green-500/70",
            )}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {clash && clash.kind === "poison" && (
          <motion.div
            key={`smoke-${clash.id}`}
            initial={{ opacity: 0.8, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -40, scale: 1.4 }}
            transition={{ duration: 0.7 }}
            className="pointer-events-none absolute h-16 w-32 rounded-full bg-green-500/40 blur-2xl"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({ left, right, center }: { left: React.ReactNode; right: React.ReactNode; center: React.ReactNode }) {
  return (
    <div className="flex items-stretch gap-2 px-2 py-1.5 md:px-4">
      <div className="flex shrink-0 items-center">{left}</div>
      <div className="flex-1">{center}</div>
      <div className="flex shrink-0 items-center">{right}</div>
    </div>
  );
}

function MonsterRow({
  cards, isYou, phase, onAttack, highlightSlots = [], selectable = false,
}: { cards: (Card | null)[]; isYou: boolean; phase: Phase; onAttack: (slot: number) => void; highlightSlots?: number[]; selectable?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 md:gap-2">
      {cards.map((c, i) => (
        <button
          key={i}
          disabled={!isYou || !c}
          onClick={() => c && onAttack(i)}
          className={cn(
            "relative aspect-[3/4] overflow-hidden rounded border-2 border-dashed border-border/50 bg-background/30 transition",
            "h-[88px] sm:h-[104px] md:h-[120px] lg:h-[136px]",
            c && `card-frame-${c.rarity} border-solid`,
            isYou && c && phase === "Battle" && "ring-2 ring-crimson/70 hover:scale-[1.03] cursor-pointer",
            isYou && c && selectable && "ring-2 ring-accent/80 cursor-pointer animate-pulse",
            highlightSlots.includes(i) && "ring-4 ring-crimson outline outline-2 outline-crimson/80",
          )}
        >
          {c ? (
            <>
              <img src={c.art} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent p-1">
                <div className="truncate font-display text-[10px] leading-tight md:text-[11px]">{c.name}</div>
                <div className="text-[9px] text-gold tabular-nums md:text-[10px]">Lv{cardLevel(c)} · {c.atk}/{c.def}</div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center font-display text-2xl text-gold/15">𓂀</div>
          )}
        </button>
      ))}
    </div>
  );
}

function SealCenter({ clash, turn, phase }: { clash: { id: number; kind: "hit" | "poison" | "direct" } | null; turn: "you" | "opp"; phase: Phase }) {
  return (
    <div className="relative my-1 flex flex-1 items-center justify-center overflow-hidden">
      {/* horizon gradient lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" style={{ boxShadow: "0 0 18px rgba(201,168,76,0.4)" }} />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" style={{ boxShadow: "0 0 18px rgba(201,168,76,0.4)" }} />
      {/* the seal */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-[140px] w-[140px] rounded-full border border-gold/40 md:h-[200px] md:w-[200px]" />
          <div className="absolute h-[110px] w-[110px] rounded-full border border-gold/30 md:h-[160px] md:w-[160px]" style={{ borderStyle: "dashed" }} />
          <div className="absolute h-[170px] w-[170px] rounded-full border border-gold/20 md:h-[240px] md:w-[240px]" />
          <div className="font-display text-[64px] leading-none text-gold/60 drop-shadow-[0_0_18px_rgba(201,168,76,0.5)] md:text-[110px]">𓂀</div>
        </div>
        <div className="mt-2 rounded-full border border-gold/60 bg-background/80 px-4 py-1 font-display text-[10px] uppercase tracking-[0.5em] text-gold backdrop-blur md:text-xs">
          ✦ XOVIA ✦
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          {turn === "you" ? `Your ${phase}` : "Opponent acts"}
        </div>
      </div>

      {/* Shared Extra Monster Zones (amber) — flank the seal */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4 md:px-12 lg:px-20">
        <div className="flex h-[70px] w-[54px] flex-col items-center justify-center rounded border border-[hsl(38,90%,58%)]/80 bg-[hsl(38,90%,58%)]/15 md:h-[88px] md:w-[68px]">
          <div className="font-display text-2xl text-[hsl(38,90%,58%)]">★</div>
          <div className="text-[7px] uppercase tracking-widest text-[hsl(38,90%,68%)]">Extra MZ</div>
        </div>
        <div className="flex h-[70px] w-[54px] flex-col items-center justify-center rounded border border-[hsl(38,90%,58%)]/80 bg-[hsl(38,90%,58%)]/15 md:h-[88px] md:w-[68px]">
          <div className="font-display text-2xl text-[hsl(38,90%,58%)]">★</div>
          <div className="text-[7px] uppercase tracking-widest text-[hsl(38,90%,68%)]">Extra MZ</div>
        </div>
      </div>

      {/* clash effects */}
      <AnimatePresence>
        {clash && (
          <motion.div
            key={clash.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1.8 }}
            exit={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
              "pointer-events-none absolute h-32 w-32 rounded-full blur-2xl",
              clash.kind === "hit" && "bg-crimson/70",
              clash.kind === "direct" && "bg-gold/70",
              clash.kind === "poison" && "bg-green-500/70",
            )}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ZoneRow({ zones, variant, facedown }: { zones: (Card | null)[]; variant: "st"; facedown?: boolean }) {
  return (
    <div className="px-2 md:px-4">
      <div className="grid grid-cols-5 gap-1.5 md:gap-2">
        {zones.map((c, i) => (
          <div
            key={i}
            className={cn(
              "relative h-[42px] overflow-hidden rounded border border-dashed border-border/50 bg-background/20 md:h-[52px] lg:h-[60px]",
            )}
          >
            {c ? (
              facedown ? (
                <div className="flex h-full items-center justify-center font-display text-base text-gold/70 bg-gradient-to-br from-background to-card/80">𓂀</div>
              ) : (
                <img src={c.art} alt={c.name} className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full items-center justify-center font-display text-lg text-gold/15">☥</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SideZone({ label }: { label: string }) {
  return (
    <div className="flex h-full w-[54px] flex-col items-center justify-center rounded border border-dashed border-border/50 bg-background/20 md:w-[70px]">
      <div className="font-display text-xl text-gold/20">☥</div>
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

const ZONE_TONES: Record<string, string> = {
  coral:  "border-[hsl(8,75%,62%)]/70 bg-[hsl(8,75%,62%)]/10 ring-[hsl(8,75%,62%)]/40",
  teal:   "border-[hsl(180,55%,50%)]/70 bg-[hsl(180,55%,50%)]/10 ring-[hsl(180,55%,50%)]/40",
  amber:  "border-[hsl(38,90%,58%)]/80 bg-[hsl(38,90%,58%)]/15 ring-[hsl(38,90%,58%)]/50",
  green:  "border-[hsl(140,55%,48%)]/70 bg-[hsl(140,55%,48%)]/10 ring-[hsl(140,55%,48%)]/40",
  purple: "border-[hsl(270,55%,62%)]/70 bg-[hsl(270,55%,62%)]/10 ring-[hsl(270,55%,62%)]/40",
  gray:   "border-border/60 bg-muted/30 ring-border/40",
};

function CornerZone({ label, tone, count, stacked }: { label: string; tone: keyof typeof ZONE_TONES; count?: number; stacked?: boolean }) {
  return (
    <div className={cn("flex h-full w-[54px] flex-col items-center justify-center rounded border md:w-[70px]", ZONE_TONES[tone])}>
      {stacked ? (
        <div className="relative h-9 w-7">
          <div className="absolute inset-0 rotate-[-4deg] rounded-sm border border-gold/40 bg-gradient-to-br from-background to-card/80" />
          <div className="absolute inset-0 rotate-[2deg] rounded-sm border border-gold/40 bg-gradient-to-br from-background to-card/80" />
          <div className="absolute inset-0 flex items-center justify-center font-display text-[10px] text-gold/70">𓂀</div>
        </div>
      ) : (
        <div className="font-display text-xl opacity-60">☥</div>
      )}
      <div className="mt-1 text-[8px] uppercase tracking-widest text-foreground/70">{label}</div>
      {typeof count === "number" && <div className="font-display text-[11px] text-gold tabular-nums">{count}</div>}
    </div>
  );
}

function GraveyardZone({ count }: { count: number }) {
  return (
    <div className="flex h-full w-[54px] flex-col items-center justify-center rounded border border-crimson/40 bg-background/30 md:w-[70px]">
      <div className="relative h-9 w-7">
        <div className="absolute inset-0 rotate-[-4deg] rounded-sm border border-gold/40 bg-gradient-to-br from-background to-card/80" />
        <div className="absolute inset-0 rotate-[2deg] rounded-sm border border-gold/40 bg-gradient-to-br from-background to-card/80" />
        <div className="absolute inset-0 flex items-center justify-center font-display text-[10px] text-gold/70">𓂀</div>
      </div>
      <div className="mt-1 text-[8px] uppercase tracking-widest text-muted-foreground">Grave</div>
      <div className="font-display text-[11px] text-gold tabular-nums">{count}</div>
    </div>
  );
}
