import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/games")({
  component: GamesPage,
  head: () => ({
    meta: [
      { title: "Games — EXODIA5 Kids Arcade" },
      {
        name: "description",
        content:
          "A safe, simple arcade for kids inside EXODIA5: memory match, color tap reflex, and quick math mountain. No ads. No chat with strangers.",
      },
      { property: "og:title", content: "EXODIA5 Kids Arcade" },
      {
        property: "og:description",
        content: "Fun, kid-safe browser games inside the EXODIA5 world.",
      },
    ],
  }),
});

type GameKey = "memory" | "tap" | "math";

function GamesPage() {
  const [active, setActive] = useState<GameKey | null>(null);

  return (
    <main className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      <div className="fixed inset-0 cyber-grid opacity-15 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70 hover:text-neon-cyan"
        >
          ◂ home
        </Link>
        <h1 className="font-display text-xl sm:text-3xl font-black text-neon-gold">
          KIDS ARCADE
        </h1>
        <Link
          to="/workspace"
          className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70 hover:text-neon-cyan"
        >
          workspace ▸
        </Link>
      </header>

      <p className="relative z-10 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-neon-cyan/60 px-4">
        ◆ safe space · no chat · no ads · just play ◆
      </p>

      <section className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {!active && (
          <div className="grid gap-4 sm:grid-cols-3">
            <GameCard
              title="Memory Match"
              tag="🧠 brain"
              desc="Flip cards. Find the pairs. Don't forget where they are."
              onPlay={() => setActive("memory")}
              accent="cyan"
            />
            <GameCard
              title="Color Tap"
              tag="⚡ reflex"
              desc="Tap the right color before the timer runs out."
              onPlay={() => setActive("tap")}
              accent="gold"
            />
            <GameCard
              title="Math Mountain"
              tag="➕ numbers"
              desc="Climb the mountain by solving quick math problems."
              onPlay={() => setActive("math")}
              accent="purple"
            />
          </div>
        )}

        {active && (
          <div className="space-y-4">
            <button
              onClick={() => setActive(null)}
              className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70 hover:text-neon-cyan border border-neon-cyan/40 px-3 py-1.5"
            >
              ◂ back to arcade
            </button>
            {active === "memory" && <MemoryGame />}
            {active === "tap" && <ColorTapGame />}
            {active === "math" && <MathGame />}
          </div>
        )}
      </section>
    </main>
  );
}

function GameCard({
  title,
  tag,
  desc,
  onPlay,
  accent,
}: {
  title: string;
  tag: string;
  desc: string;
  onPlay: () => void;
  accent: "cyan" | "gold" | "purple";
}) {
  const ring =
    accent === "cyan"
      ? "border-neon-cyan/50 hover:border-neon-cyan shadow-[0_0_25px_oklch(0.75_0.18_220/25%)]"
      : accent === "gold"
        ? "border-neon-gold/50 hover:border-neon-gold shadow-[0_0_25px_oklch(0.78_0.15_85/25%)]"
        : "border-neon-purple/50 hover:border-neon-purple shadow-[0_0_25px_oklch(0.65_0.28_300/25%)]";
  const text =
    accent === "cyan"
      ? "text-neon-cyan"
      : accent === "gold"
        ? "text-neon-gold"
        : "text-neon-purple";
  return (
    <button
      onClick={onPlay}
      className={`text-left glass rounded-md p-5 border ${ring} transition-all hover:scale-[1.02]`}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {tag}
      </div>
      <div className={`mt-2 font-display text-2xl font-black ${text}`}>
        {title}
      </div>
      <p className="mt-2 text-sm text-foreground/80">{desc}</p>
      <div className={`mt-4 font-mono text-[10px] uppercase tracking-widest ${text}`}>
        ▶ play
      </div>
    </button>
  );
}

/* ───────────────────────── MEMORY MATCH ───────────────────────── */

const MEMORY_EMOJI = ["🦁", "🐯", "🐸", "🦊", "🐼", "🐵", "🐙", "🦄"];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type MCard = { id: number; symbol: string; flipped: boolean; matched: boolean };

function MemoryGame() {
  const buildDeck = (): MCard[] =>
    shuffle(
      [...MEMORY_EMOJI, ...MEMORY_EMOJI].map((s, i) => ({
        id: i,
        symbol: s,
        flipped: false,
        matched: false,
      })),
    );

  const [cards, setCards] = useState<MCard[]>(buildDeck);
  const [pick, setPick] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const won = cards.every((c) => c.matched);

  const flip = (idx: number) => {
    if (busy || cards[idx].flipped || cards[idx].matched) return;
    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(next);

    if (pick === null) {
      setPick(idx);
    } else {
      setMoves((m) => m + 1);
      setBusy(true);
      const a = next[pick];
      const b = next[idx];
      if (a.symbol === b.symbol) {
        setTimeout(() => {
          setCards((cs) =>
            cs.map((c) =>
              c.symbol === a.symbol ? { ...c, matched: true } : c,
            ),
          );
          setPick(null);
          setBusy(false);
        }, 350);
      } else {
        setTimeout(() => {
          setCards((cs) =>
            cs.map((c, i) =>
              i === pick || i === idx ? { ...c, flipped: false } : c,
            ),
          );
          setPick(null);
          setBusy(false);
        }, 900);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="text-neon-cyan">moves: {moves}</div>
        <button
          onClick={() => {
            setCards(buildDeck());
            setPick(null);
            setMoves(0);
          }}
          className="text-neon-gold/80 border border-neon-gold/40 px-3 py-1 hover:bg-neon-gold/10 uppercase tracking-widest text-[10px]"
        >
          ↻ reset
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            aria-label={c.flipped ? c.symbol : "hidden card"}
            className={`aspect-square rounded-md flex items-center justify-center text-3xl sm:text-4xl transition-all ${
              c.matched
                ? "bg-neon-cyan/20 border border-neon-cyan/60"
                : c.flipped
                  ? "bg-neon-purple/20 border border-neon-purple/60"
                  : "glass border border-neon-cyan/30 hover:border-neon-cyan/60"
            }`}
          >
            {c.flipped || c.matched ? c.symbol : "?"}
          </button>
        ))}
      </div>
      {won && (
        <div className="text-center font-display text-xl text-neon-gold">
          🎉 You did it in {moves} moves!
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── COLOR TAP ───────────────────────── */

const TAP_COLORS = [
  { name: "red", hex: "#ef4444" },
  { name: "blue", hex: "#3b82f6" },
  { name: "green", hex: "#10b981" },
  { name: "gold", hex: "#e8b84a" },
  { name: "purple", hex: "#a78bfa" },
];

function ColorTapGame() {
  const [target, setTarget] = useState(TAP_COLORS[0]);
  const [options, setOptions] = useState(TAP_COLORS.slice(0, 4));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [running, setRunning] = useState(false);

  const newRound = () => {
    const opts = shuffle(TAP_COLORS).slice(0, 4);
    setOptions(opts);
    setTarget(opts[Math.floor(Math.random() * opts.length)]);
  };

  const start = () => {
    setScore(0);
    setTime(20);
    setRunning(true);
    newRound();
  };

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, running]);

  const tap = (hex: string) => {
    if (!running) return;
    if (hex === target.hex) {
      setScore((s) => s + 1);
      newRound();
    } else {
      setTime((t) => Math.max(0, t - 2));
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-between font-mono text-xs max-w-md mx-auto">
        <div className="text-neon-cyan">score: {score}</div>
        <div className="text-neon-gold">⏱ {time}s</div>
      </div>

      {!running ? (
        <div className="space-y-4">
          {time === 0 && score > 0 && (
            <div className="font-display text-2xl text-neon-gold">
              🎯 Final score: {score}
            </div>
          )}
          <button
            onClick={start}
            className="glass border border-neon-cyan/60 px-8 py-3 font-display text-lg text-neon-cyan hover:bg-neon-cyan/10 glow-cyan"
          >
            ▶ {time === 0 ? "play again" : "start"}
          </button>
          <p className="text-sm text-muted-foreground">
            Tap the color you see written. Wrong tap = lose 2 seconds.
          </p>
        </div>
      ) : (
        <>
          <div
            className="font-display text-5xl sm:text-6xl font-black"
            style={{ color: shuffle(TAP_COLORS).filter((c) => c.hex !== target.hex)[0].hex }}
          >
            {target.name.toUpperCase()}
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {options.map((o) => (
              <button
                key={o.hex}
                onClick={() => tap(o.hex)}
                className="aspect-[2/1] rounded-md border-2 border-white/20 hover:scale-[1.03] transition"
                style={{ backgroundColor: o.hex }}
                aria-label={o.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── MATH MOUNTAIN ───────────────────────── */

function MathGame() {
  const makeQ = (level: number) => {
    const max = Math.min(5 + level * 2, 30);
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    const op = level < 3 ? "+" : Math.random() < 0.5 ? "+" : "-";
    const answer = op === "+" ? a + b : Math.max(a, b) - Math.min(a, b);
    const text = op === "+" ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}`;
    return { text, answer };
  };

  const [level, setLevel] = useState(1);
  const [q, setQ] = useState(() => makeQ(1));
  const [val, setVal] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const choices = useMemo(() => {
    const wrong = new Set<number>();
    while (wrong.size < 3) {
      const w = q.answer + (Math.floor(Math.random() * 7) - 3);
      if (w !== q.answer && w >= 0) wrong.add(w);
    }
    return shuffle([q.answer, ...Array.from(wrong)]);
  }, [q]);

  const submit = (guess: number) => {
    if (guess === q.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setFeedback("✅ Correct!");
      const nextLevel = nextStreak % 3 === 0 ? level + 1 : level;
      setLevel(nextLevel);
      setTimeout(() => {
        setQ(makeQ(nextLevel));
        setVal("");
        setFeedback(null);
      }, 600);
    } else {
      setStreak(0);
      setFeedback(`Almost! The answer was ${q.answer}.`);
      setTimeout(() => {
        setQ(makeQ(level));
        setVal("");
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-5 text-center max-w-md mx-auto">
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="text-neon-cyan">level: {level}</div>
        <div className="text-neon-gold">streak: {streak} 🔥</div>
      </div>
      <div className="glass border border-neon-purple/40 rounded-md py-10">
        <div className="font-display text-5xl font-black text-neon-cyan">
          {q.text} = ?
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => submit(c)}
            className="glass border border-neon-cyan/40 hover:border-neon-cyan py-4 font-display text-2xl text-neon-cyan hover:bg-neon-cyan/10"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-center">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/[^0-9-]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val !== "") submit(Number(val));
          }}
          placeholder="or type the answer"
          aria-label="Type your answer"
          className="bg-transparent border border-neon-gold/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-neon-gold w-40 text-center"
        />
        <button
          onClick={() => val !== "" && submit(Number(val))}
          className="font-mono text-[10px] uppercase tracking-widest text-neon-gold border border-neon-gold/40 px-3 py-2 hover:bg-neon-gold/10"
        >
          go
        </button>
      </div>
      {feedback && (
        <div className="font-display text-lg text-neon-gold">{feedback}</div>
      )}
    </div>
  );
}
