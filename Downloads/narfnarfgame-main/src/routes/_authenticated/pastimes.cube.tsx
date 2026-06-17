import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/pastimes/cube")({
  head: () => ({
    meta: [
      { title: "Cube — Pastimes — Narf Narf" },
      { name: "description", content: "Scramble and solve a 3×3 cube." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CubePage,
});

type Face = "U" | "D" | "L" | "R" | "F" | "B";
type State = Record<Face, string[]>; // 9 stickers per face

const COLOR: Record<string, string> = {
  W: "#f8fafc", Y: "#facc15", G: "#34d399", B: "#3b82f6", O: "#fb923c", R: "#ef4444",
};
const CENTER: Record<Face, string> = { U: "W", D: "Y", F: "G", B: "B", L: "O", R: "R" };

function solved(): State {
  const make = (c: string) => Array.from({ length: 9 }, () => c);
  return { U: make("W"), D: make("Y"), F: make("G"), B: make("B"), L: make("O"), R: make("R") };
}

const CW_FACE = [6, 3, 0, 7, 4, 1, 8, 5, 2];
const CCW_FACE = [2, 5, 8, 1, 4, 7, 0, 3, 6];
function rotFace(face: string[], cw: boolean) {
  const m = cw ? CW_FACE : CCW_FACE;
  return m.map(i => face[i]);
}

/** Cycle stickers along a 4-segment loop. For CW: new[next] = old[prev]. */
function cyc(s: State, segs: { f: Face; i: number[] }[]) {
  const captured = segs.map(seg => seg.i.map(i => s[seg.f][i]));
  for (let k = 0; k < segs.length; k++) {
    const dest = segs[(k + 1) % segs.length];
    const src = captured[k];
    dest.i.forEach((idx, j) => { s[dest.f][idx] = src[j]; });
  }
}

function move(prev: State, m: string): State {
  const s: State = { U: [...prev.U], D: [...prev.D], L: [...prev.L], R: [...prev.R], F: [...prev.F], B: [...prev.B] };
  const face = m[0] as Face;
  const cw = !m.endsWith("'");
  s[face] = rotFace(s[face], cw);

  const segs: Record<Face, { f: Face; i: number[] }[]> = {
    U: [
      { f: "F", i: [0, 1, 2] }, { f: "L", i: [0, 1, 2] },
      { f: "B", i: [0, 1, 2] }, { f: "R", i: [0, 1, 2] },
    ],
    D: [
      { f: "F", i: [6, 7, 8] }, { f: "R", i: [6, 7, 8] },
      { f: "B", i: [6, 7, 8] }, { f: "L", i: [6, 7, 8] },
    ],
    R: [
      { f: "U", i: [2, 5, 8] }, { f: "B", i: [6, 3, 0] },
      { f: "D", i: [2, 5, 8] }, { f: "F", i: [2, 5, 8] },
    ],
    L: [
      { f: "U", i: [0, 3, 6] }, { f: "F", i: [0, 3, 6] },
      { f: "D", i: [0, 3, 6] }, { f: "B", i: [8, 5, 2] },
    ],
    F: [
      { f: "U", i: [6, 7, 8] }, { f: "R", i: [0, 3, 6] },
      { f: "D", i: [2, 1, 0] }, { f: "L", i: [8, 5, 2] },
    ],
    B: [
      { f: "U", i: [2, 1, 0] }, { f: "L", i: [0, 3, 6] },
      { f: "D", i: [6, 7, 8] }, { f: "R", i: [8, 5, 2] },
    ],
  };
  // For CW we cycle in the listed order (segs[0] → segs[1] → ...).
  // For CCW we reverse the segment list before cycling.
  cyc(s, cw ? segs[face] : [...segs[face]].reverse());
  return s;
}

function isSolved(s: State) {
  return (Object.keys(s) as Face[]).every(f => s[f].every(x => x === CENTER[f]));
}

const MOVES = ["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"];

function scramble(n = 25): string[] {
  const out: string[] = [];
  let lastFace = "";
  for (let i = 0; i < n; i++) {
    let pick = MOVES[Math.floor(Math.random() * MOVES.length)];
    while (pick[0] === lastFace) pick = MOVES[Math.floor(Math.random() * MOVES.length)];
    lastFace = pick[0];
    out.push(pick);
  }
  return out;
}

function CubePage() {
  const [state, setState] = useState<State>(() => solved());
  const [history, setHistory] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const wasSolvedRef = useRef(true);

  // Timer
  useEffect(() => {
    if (startedAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [startedAt]);

  // Detect solve transition
  useEffect(() => {
    const s = isSolved(state);
    if (!s) wasSolvedRef.current = false;
    if (s && !wasSolvedRef.current && startedAt != null) {
      wasSolvedRef.current = true;
      // freeze timer by capturing end time; we keep startedAt but stop ticking by nulling later
    }
  }, [state, startedAt]);

  const apply = useCallback((m: string) => {
    setState(prev => move(prev, m));
    setHistory(h => [...h, m]);
  }, []);

  const doScramble = useCallback(() => {
    let s = solved();
    const seq = scramble(25);
    seq.forEach(m => { s = move(s, m); });
    setState(s);
    setHistory([]);
    setStartedAt(Date.now());
    setNow(Date.now());
    wasSolvedRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setState(solved());
    setHistory([]);
    setStartedAt(null);
    wasSolvedRef.current = true;
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      const inv = last.endsWith("'") ? last[0] : `${last[0]}'`;
      setState(prev => move(prev, inv));
      return h.slice(0, -1);
    });
  }, []);

  const solvedNow = useMemo(() => isSolved(state), [state]);
  const elapsed = startedAt && !solvedNow ? (now - startedAt) / 1000 : startedAt && solvedNow ? null : 0;

  return (
    <div className="min-h-dvh px-4 py-6 pb-24 md:pb-10" style={{ background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)" }}>
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>PASTIMES · CUBE</div>
            <h1 className="mt-1 font-display text-2xl tracking-tight">3×3 PUZZLE</h1>
          </div>
          <Link to="/pastimes" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">← BACK</Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono tracking-widest text-muted-foreground">
            <span>
              {solvedNow && startedAt != null && history.length > 0
                ? `SOLVED · ${(((now - startedAt) / 1000)).toFixed(1)}s`
                : startedAt != null
                ? `TIME · ${(elapsed ?? 0).toFixed(1)}s · ${history.length} moves`
                : "Scramble to start"}
            </span>
            <div className="flex gap-2">
              <button onClick={undo} disabled={history.length === 0} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5 disabled:opacity-40">Undo</button>
              <button onClick={doScramble} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">Scramble</button>
              <button onClick={reset} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">Reset</button>
            </div>
          </div>

          <Net state={state} />

          <div className="mt-3 grid grid-cols-6 gap-1">
            {(["U", "L", "F", "R", "B", "D"] as Face[]).flatMap(f => [
              <MoveBtn key={f} label={f} onClick={() => apply(f)} />,
              <MoveBtn key={`${f}p`} label={`${f}'`} onClick={() => apply(`${f}'`)} />,
            ])}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Tap a face button to rotate it clockwise; primed buttons rotate counter-clockwise. Timer starts on scramble.
        </p>
      </div>
    </div>
  );
}

function MoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded border border-white/15 bg-black/30 px-2 py-2 font-display text-xs tracking-widest hover:bg-white/5">
      {label}
    </button>
  );
}

function Net({ state }: { state: State }) {
  // Grid layout: 12 cols × 9 rows of stickers
  // Row 0..2: cols 3..5 = U
  // Row 3..5: cols 0..2 = L, 3..5 = F, 6..8 = R, 9..11 = B
  // Row 6..8: cols 3..5 = D
  const cellSize = "min(10vw, 36px)";
  const cellStyle = (color?: string) => ({
    width: cellSize,
    height: cellSize,
    background: color ? COLOR[color] : "transparent",
    border: color ? "1px solid rgba(0,0,0,0.35)" : "none",
    borderRadius: 4,
  });

  const renderFace = (face: Face) => (
    <div className="grid grid-cols-3 gap-[2px]">
      {state[face].map((c, i) => <div key={i} style={cellStyle(c)} />)}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-[2px]">
      <div className="flex">{renderFace("U")}</div>
      <div className="flex gap-[2px]">
        {renderFace("L")}
        {renderFace("F")}
        {renderFace("R")}
        {renderFace("B")}
      </div>
      <div className="flex">{renderFace("D")}</div>
    </div>
  );
}
