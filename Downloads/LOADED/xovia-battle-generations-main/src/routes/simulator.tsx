import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CARDS, type Card } from "@/data/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulator")({
  component: SimulatorPage,
  head: () => ({
    meta: [
      { title: "Battle Simulator — Test Any Card vs Any Card" },
      { name: "description", content: "Pit any card in the Exodia dynasty against any other in a chess-table style duel. Abilities trigger, damage resolves, and the dust tells the story." },
      { property: "og:title", content: "Battle Simulator — Exodia NFT Battle" },
      { property: "og:description", content: "Test your cards against the entire database in turn-based duels." },
      { property: "og:url", content: "/simulator" },
    ],
    links: [{ rel: "canonical", href: "/simulator" }],
  }),
});

type Log = { round: number; side: "you" | "foe" | "system"; text: string };
type SimResult = {
  logs: Log[];
  winner: "you" | "foe" | "draw";
  youHpStart: number; foeHpStart: number;
  youHpEnd: number; foeHpEnd: number;
};

function vitality(c: Card) {
  // Stat pool used as HP in the simulator
  return Math.max(800, c.def + Math.round(c.divinity * 12));
}

function simulate(you: Card, foe: Card): SimResult {
  const logs: Log[] = [];
  const youStart = vitality(you);
  const foeStart = vitality(foe);
  let youHp = youStart;
  let foeHp = foeStart;
  let youAtk = you.atk;
  let foeAtk = foe.atk;
  let youDef = you.def;
  let foeDef = foe.def;
  let youShield = 0;
  let foeShield = 0;
  let youResurrected = false;
  let foeResurrected = false;
  const youBound = foe.ability?.kind === "Bind";
  const foeBound = you.ability?.kind === "Bind";

  // Exodia instant win
  const youEx = !youBound && you.ability?.kind === "AssembleExodius";
  const foeEx = !foeBound && foe.ability?.kind === "AssembleExodius";
  if (youEx && foe.rarity === "Exodius") {
    logs.push({ round: 0, side: "system", text: "Both wield Exodia relics — the seal of the Forbidden God breaks the duel in your favor." });
    return { logs, winner: "you", youHpStart: youStart, foeHpStart: foeStart, youHpEnd: youHp, foeHpEnd: 0 };
  }
  if (foeEx && you.rarity === "Exodius") {
    logs.push({ round: 0, side: "system", text: "The opponent assembles a relic against yours — the seal turns against you." });
    return { logs, winner: "foe", youHpStart: youStart, foeHpStart: foeStart, youHpEnd: 0, foeHpEnd: foeHp };
  }

  // Pre-combat passives
  if (!youBound && you.ability) {
    const a = you.ability;
    if (a.kind === "Sandstorm") { foeAtk = Math.max(0, foeAtk - (a.value ?? 500)); logs.push({ round: 0, side: "you", text: `${you.name} kicks up a sandstorm. Foe ATK ↓ ${a.value ?? 500}.` }); }
    if (a.kind === "Eclipse")   { const t = foeAtk; foeAtk = foeDef; foeDef = t; logs.push({ round: 0, side: "you", text: `${you.name} swaps the foe's ATK and DEF.` }); }
    if (a.kind === "DivineShield") { youShield = a.value ?? 9999; logs.push({ round: 0, side: "you", text: `${you.name} raises a shield (${youShield === 9999 ? "first strike negated" : `absorbs ${youShield}`}).` }); }
    if (a.kind === "Burn")  { const dmg = a.value ?? 500; foeHp -= dmg; logs.push({ round: 0, side: "you", text: `${a.name} burns the foe for ${dmg} unstoppable damage.` }); }
    if (a.kind === "Smite") { youAtk += 500; logs.push({ round: 0, side: "you", text: `${you.name} channels smite. ATK ↑ 500.` }); }
  }
  if (!foeBound && foe.ability) {
    const a = foe.ability;
    if (a.kind === "Sandstorm") { youAtk = Math.max(0, youAtk - (a.value ?? 500)); logs.push({ round: 0, side: "foe", text: `${foe.name} kicks up a sandstorm. Your ATK ↓ ${a.value ?? 500}.` }); }
    if (a.kind === "Eclipse")   { const t = youAtk; youAtk = youDef; youDef = t; logs.push({ round: 0, side: "foe", text: `${foe.name} swaps your ATK and DEF.` }); }
    if (a.kind === "DivineShield") { foeShield = a.value ?? 9999; logs.push({ round: 0, side: "foe", text: `${foe.name} raises a shield.` }); }
    if (a.kind === "Burn")  { const dmg = a.value ?? 500; youHp -= dmg; logs.push({ round: 0, side: "foe", text: `${a.name} burns you for ${dmg} unstoppable damage.` }); }
    if (a.kind === "Smite") { foeAtk += 500; logs.push({ round: 0, side: "foe", text: `${foe.name} channels smite. ATK ↑ 500.` }); }
  }

  // Banish check
  if (!youBound && you.ability?.kind === "Banish" && foe.atk < (you.ability.value ?? 1500)) {
    logs.push({ round: 0, side: "you", text: `${you.name} devours ${foe.name} — banished from the field.` });
    return { logs, winner: "you", youHpStart: youStart, foeHpStart: foeStart, youHpEnd: youHp, foeHpEnd: 0 };
  }
  if (!foeBound && foe.ability?.kind === "Banish" && you.atk < (foe.ability.value ?? 1500)) {
    logs.push({ round: 0, side: "foe", text: `${foe.name} devours ${you.name} — banished from the field.` });
    return { logs, winner: "foe", youHpStart: youStart, foeHpStart: foeStart, youHpEnd: 0, foeHpEnd: foeHp };
  }

  const youFirst = !youBound && (you.ability?.kind === "FirstStrike" || you.ability?.kind === "Judgment");
  const foeFirst = !foeBound && (foe.ability?.kind === "FirstStrike" || foe.ability?.kind === "Judgment");
  const youGoesFirst = youFirst && !foeFirst ? true
    : foeFirst && !youFirst ? false
    : you.divinity >= foe.divinity;

  const strike = (
    attacker: "you" | "foe",
    round: number,
  ) => {
    const A = attacker === "you" ? { card: you, atk: youAtk, ab: youBound ? undefined : you.ability } : { card: foe, atk: foeAtk, ab: foeBound ? undefined : foe.ability };
    const D = attacker === "you" ? { card: foe, def: foeDef, ab: foeBound ? undefined : foe.ability } : { card: you, def: youDef, ab: youBound ? undefined : you.ability };

    const hits = A.ab?.kind === "DoubleStrike" ? 2 : 1;
    const mult = A.ab?.kind === "DoubleStrike" ? (A.ab.value ?? 60) / 100 : 1;

    for (let h = 0; h < hits; h++) {
      let dmg = Math.max(0, Math.round(A.atk * mult - D.def * 0.5));

      // Judgment bonus on first round only
      if (A.ab?.kind === "Judgment" && round === 1 && D.card.divinity < 40) {
        dmg += A.ab.value ?? 1000;
      }
      // FirstStrike bonus value applies on round 1
      if (A.ab?.kind === "FirstStrike" && round === 1 && A.ab.value) {
        dmg += A.ab.value;
      }

      // Apply defender shield
      let absorbed = 0;
      if (attacker === "you" && foeShield > 0) {
        if (foeShield === 9999) { absorbed = dmg; dmg = 0; foeShield = 0; }
        else { absorbed = Math.min(foeShield, dmg); dmg -= absorbed; foeShield -= absorbed; }
      } else if (attacker === "foe" && youShield > 0) {
        if (youShield === 9999) { absorbed = dmg; dmg = 0; youShield = 0; }
        else { absorbed = Math.min(youShield, dmg); dmg -= absorbed; youShield -= absorbed; }
      }

      // Counter
      let counter = 0;
      if (D.ab?.kind === "Counter" && dmg > 0) {
        counter = Math.round(dmg * (D.ab.value ?? 30) / 100);
      }

      // Pierce: extra damage beyond DEF
      if (A.ab?.kind === "Pierce") {
        const raw = A.atk * mult;
        const excess = Math.max(0, raw - D.def);
        const bonus = Math.round(excess * (A.ab.value ?? 50) / 100);
        dmg += bonus;
      }

      // Apply damage
      if (attacker === "you") foeHp -= dmg; else youHp -= dmg;
      logs.push({
        round, side: attacker,
        text: `${A.card.name} strikes ${D.card.name} for ${dmg}${absorbed ? ` (${absorbed} absorbed)` : ""}.`,
      });

      // Drain
      if (A.ab?.kind === "Drain" && dmg > 0) {
        const heal = Math.round(dmg * (A.ab.value ?? 30) / 100);
        if (attacker === "you") youHp = Math.min(youStart, youHp + heal);
        else foeHp = Math.min(foeStart, foeHp + heal);
        logs.push({ round, side: attacker, text: `${A.card.name} drains ${heal} vitality.` });
      }

      // Apply counter
      if (counter > 0) {
        if (attacker === "you") youHp -= counter; else foeHp -= counter;
        logs.push({ round, side: attacker === "you" ? "foe" : "you", text: `${D.card.name} reflects ${counter} damage.` });
      }

      if (youHp <= 0 || foeHp <= 0) return;
    }
  };

  for (let r = 1; r <= 4; r++) {
    if (youHp <= 0 || foeHp <= 0) break;
    if (youGoesFirst) {
      strike("you", r);
      if (foeHp > 0) strike("foe", r);
    } else {
      strike("foe", r);
      if (youHp > 0) strike("you", r);
    }

    // Resurrect check
    if (youHp <= 0 && !youResurrected && !youBound && you.ability?.kind === "Resurrect") {
      youHp = Math.round(youStart * (you.ability.value ?? 50) / 100);
      youResurrected = true;
      logs.push({ round: r, side: "you", text: `${you.name} returns from the afterlife with ${youHp} vitality.` });
    }
    if (foeHp <= 0 && !foeResurrected && !foeBound && foe.ability?.kind === "Resurrect") {
      foeHp = Math.round(foeStart * (foe.ability.value ?? 50) / 100);
      foeResurrected = true;
      logs.push({ round: r, side: "foe", text: `${foe.name} returns from the afterlife with ${foeHp} vitality.` });
    }
  }

  // If still alive, decide by remaining HP
  let winner: "you" | "foe" | "draw" = "draw";
  if (youHp <= 0 && foeHp <= 0) winner = "draw";
  else if (foeHp <= 0) winner = "you";
  else if (youHp <= 0) winner = "foe";
  else winner = youHp > foeHp ? "you" : foeHp > youHp ? "foe" : you.divinity >= foe.divinity ? "you" : "foe";

  return { logs, winner, youHpStart: youStart, foeHpStart: foeStart, youHpEnd: Math.max(0, youHp), foeHpEnd: Math.max(0, foeHp) };
}

function SimulatorPage() {
  const [you, setYou] = useState<Card | null>(CARDS.find((c) => c.id === "horus") ?? null);
  const [foe, setFoe] = useState<Card | null>(CARDS.find((c) => c.id === "set") ?? null);
  const [picker, setPicker] = useState<"you" | "foe" | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);

  const canFight = !!(you && foe);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Chess Table of the Pass</div>
          <h1 className="mt-1 font-display text-4xl md:text-5xl text-gradient-gold">Battle Simulator</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pit any card against any card in the dynasty. Abilities trigger, the sand settles, the Pass remembers.
          </p>
        </div>

        {/* The chess table */}
        <div className="overflow-hidden rounded-xl border border-gold/30 bg-card/70 p-6 hieroglyph-bg">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <Slot label="Your Champion" card={you} side="you" onPick={() => setPicker("you")} onClear={() => { setYou(null); setResult(null); }} />
            <div className="flex flex-col items-center gap-2">
              <div className="font-display text-4xl text-gradient-gold">VS</div>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            </div>
            <Slot label="Opponent" card={foe} side="foe" onPick={() => setPicker("foe")} onClear={() => { setFoe(null); setResult(null); }} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              disabled={!canFight}
              className="bg-crimson text-foreground hover:bg-crimson/90 disabled:opacity-40"
              onClick={() => you && foe && setResult(simulate(you, foe))}
            >Resolve Duel</Button>
            <Button
              variant="outline"
              className="border-border/70"
              onClick={() => {
                const pool = CARDS.filter((c) => c.rarity !== "Exodius");
                const a = pool[Math.floor(Math.random() * pool.length)];
                let b = pool[Math.floor(Math.random() * pool.length)];
                while (b.id === a.id) b = pool[Math.floor(Math.random() * pool.length)];
                setYou(a); setFoe(b); setResult(null);
              }}
            >Random Match</Button>
            {result && (
              <Button variant="ghost" onClick={() => setResult(null)}>Clear Result</Button>
            )}
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]"
            >
              <div className="rounded-xl border border-gold/40 bg-card/80 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Combat Log</div>
                  <Badge className={cn(
                    "tracking-[0.18em]",
                    result.winner === "you" && "bg-gold text-gold-foreground",
                    result.winner === "foe" && "bg-crimson text-foreground",
                    result.winner === "draw" && "bg-muted text-muted-foreground",
                  )}>
                    {result.winner === "you" ? `${you?.name} wins` : result.winner === "foe" ? `${foe?.name} wins` : "Draw — the sands keep both"}
                  </Badge>
                </div>
                <ol className="space-y-2">
                  {result.logs.map((l, i) => (
                    <li key={i} className={cn(
                      "rounded border px-3 py-2 text-sm",
                      l.side === "you"   && "border-gold/30 bg-gold/5 text-foreground",
                      l.side === "foe"   && "border-crimson/30 bg-crimson/5 text-foreground",
                      l.side === "system" && "border-accent/40 bg-accent/5 text-accent",
                    )}>
                      <span className="mr-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                        {l.side === "system" ? "Omen" : `R${l.round}`}
                      </span>
                      {l.text}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-4">
                <HpBar label={you?.name ?? "You"}  hp={result.youHpEnd} max={result.youHpStart} accent="gold" />
                <HpBar label={foe?.name ?? "Foe"} hp={result.foeHpEnd} max={result.foeHpStart} accent="crimson" />
                <p className="text-xs text-muted-foreground">
                  Simulator results use deterministic stat math and trigger every card's ability. Real on-chain duels with hand management and traps arrive in Phase 2.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <SiteFooter />

      {/* Card picker */}
      <AnimatePresence>
        {picker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur md:items-center md:justify-center"
            onClick={() => setPicker(null)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full overflow-y-auto rounded-t-xl border border-gold/30 bg-card p-6 md:max-w-5xl md:rounded-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl text-gradient-gold">
                  Choose {picker === "you" ? "your champion" : "the opponent"}
                </h2>
                <Button variant="ghost" onClick={() => setPicker(null)}>Close</Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {CARDS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (picker === "you") setYou(c); else setFoe(c);
                      setResult(null);
                      setPicker(null);
                    }}
                    className={cn(
                      "group relative aspect-[3/4] overflow-hidden rounded-md text-left",
                      `card-frame-${c.rarity}`,
                    )}
                  >
                    <img src={c.art} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <div className="font-display text-xs leading-tight">{c.name}</div>
                      <div className="text-[10px] text-gold">ATK {c.atk} · DEF {c.def}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slot({ label, card, side, onPick, onClear }: { label: string; card: Card | null; side: "you" | "foe"; onPick: () => void; onClear: () => void }) {
  return (
    <div className={cn("rounded-lg border p-4", side === "you" ? "border-gold/40 bg-gold/[0.03]" : "border-crimson/40 bg-crimson/[0.04]")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
        {card && <button onClick={onClear} className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">clear</button>}
      </div>
      {card ? (
        <div className="flex gap-4">
          <div className={cn("relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded", `card-frame-${card.rarity}`)}>
            <img src={card.art} alt={card.name} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg leading-tight text-foreground">{card.name}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{card.rarity} · {card.type}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <Stat l="ATK" v={card.atk} c="text-gold" />
              <Stat l="DEF" v={card.def} c="text-silver" />
              <Stat l="DIV" v={card.divinity} c="text-accent" />
            </div>
            {card.ability && (
              <div className="mt-3 rounded border border-accent/40 bg-accent/5 p-2">
                <div className="font-display text-xs text-gradient-gold">{card.ability.name}</div>
                <div className="text-[11px] text-muted-foreground">{card.ability.description}</div>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={onPick} className="mt-3 h-7 px-2 text-[11px]">Swap card</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={onPick}
          className={cn(
            "flex h-44 w-full items-center justify-center rounded border-2 border-dashed text-sm transition-colors",
            side === "you" ? "border-gold/40 text-gold hover:bg-gold/10" : "border-crimson/40 text-crimson hover:bg-crimson/10",
          )}
        >
          + Choose a card
        </button>
      )}
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: number; c: string }) {
  return (
    <div className="rounded border border-border/60 bg-background/40 py-1">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{l}</div>
      <div className={cn("font-display text-sm", c)}>{v}</div>
    </div>
  );
}

function HpBar({ label, hp, max, accent }: { label: string; hp: number; max: number; accent: "gold" | "crimson" }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-display">{label}</span>
        <span className={accent === "gold" ? "text-gold" : "text-crimson"}>{hp} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-background">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full", accent === "gold" ? "bg-gradient-to-r from-gold to-accent" : "bg-gradient-to-r from-crimson to-gold")}
        />
      </div>
    </div>
  );
}
