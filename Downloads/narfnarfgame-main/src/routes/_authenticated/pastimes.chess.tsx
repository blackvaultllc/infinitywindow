import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Chess, type Square, type Move } from "chess.js";

export const Route = createFileRoute("/_authenticated/pastimes/chess")({
  head: () => ({
    meta: [
      { title: "Chess — Pastimes — Narf Narf" },
      { name: "description", content: "Play a quick chess match against a tactical AI." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ChessPage,
});

const GLYPH: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function pieceValue(t: string) { return ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 } as Record<string, number>)[t] ?? 0; }

/** Greedy AI: prefer best capture; fall back to a random non-losing move. */
function pickAiMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;
  const scored = moves.map(m => {
    let s = 0;
    if (m.captured) s += pieceValue(m.captured) * 10;
    if (m.promotion) s += 8;
    if (m.san.includes("#")) s += 1000;
    if (m.san.includes("+")) s += 4;
    s += Math.random() * 0.5;
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].m;
}

function ChessPage() {
  const [game, setGame] = useState(() => new Chess());
  const [sel, setSel] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);

  const fen = game.fen();
  const board = useMemo(() => game.board(), [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  const legalFromSel = useMemo<Square[]>(() => {
    if (!sel) return [];
    return (game.moves({ square: sel, verbose: true }) as Move[]).map(m => m.to as Square);
  }, [sel, fen]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = useMemo(() => {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins`;
    if (game.isStalemate()) return "Stalemate";
    if (game.isDraw()) return "Draw";
    if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move — Check`;
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  }, [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSquare = (sq: Square) => {
    if (thinking || game.isGameOver() || game.turn() !== "w") return;
    const piece = game.get(sq);
    if (sel && legalFromSel.includes(sq)) {
      const next = new Chess(fen);
      next.move({ from: sel, to: sq, promotion: "q" });
      setGame(next);
      setSel(null);
      return;
    }
    if (piece && piece.color === "w") setSel(sq);
    else setSel(null);
  };

  // AI turn
  useEffect(() => {
    if (game.isGameOver() || game.turn() !== "b") return;
    setThinking(true);
    const t = setTimeout(() => {
      const next = new Chess(game.fen());
      const m = pickAiMove(next);
      if (m) next.move({ from: m.from, to: m.to, promotion: m.promotion });
      setGame(next);
      setThinking(false);
    }, 350);
    return () => clearTimeout(t);
  }, [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => { setGame(new Chess()); setSel(null); }, []);

  const undo = useCallback(() => {
    const n = new Chess(game.fen());
    n.undo(); n.undo(); // undo AI + player
    setGame(n); setSel(null);
  }, [game]);

  return (
    <div className="min-h-dvh px-4 py-6 pb-24 md:pb-10" style={{ background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)" }}>
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#EF9F27" }}>PASTIMES · CHESS</div>
            <h1 className="mt-1 font-display text-2xl tracking-tight">YOU (WHITE) VS AI</h1>
          </div>
          <Link to="/pastimes" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">← BACK</Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono tracking-widest text-muted-foreground">
            <span>{thinking ? "AI thinking…" : status}</span>
            <div className="flex gap-2">
              <button onClick={undo} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">Undo</button>
              <button onClick={reset} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">Reset</button>
            </div>
          </div>
          <div className="grid grid-cols-8 overflow-hidden rounded-lg border border-white/10">
            {board.map((row, rIdx) => row.map((cell, cIdx) => {
              const file = "abcdefgh"[cIdx];
              const rank = 8 - rIdx;
              const sq = `${file}${rank}` as Square;
              const dark = (rIdx + cIdx) % 2 === 1;
              const isSel = sel === sq;
              const isTarget = legalFromSel.includes(sq);
              const key = cell ? `${cell.color}${cell.type.toUpperCase()}` : null;
              return (
                <button
                  key={sq}
                  onClick={() => onSquare(sq)}
                  className="relative aspect-square flex items-center justify-center text-2xl sm:text-3xl select-none"
                  style={{
                    background: isSel ? "rgba(239,159,39,0.45)" : dark ? "#1a2747" : "#2c3a63",
                    color: cell?.color === "w" ? "#f8fafc" : "#0b1224",
                    textShadow: cell?.color === "w" ? "0 1px 2px rgba(0,0,0,0.6)" : "0 1px 1px rgba(255,255,255,0.2)",
                  }}
                  aria-label={sq}
                >
                  {key ? GLYPH[key] : null}
                  {isTarget && (
                    <span className="pointer-events-none absolute inset-2 rounded-full border-2" style={{ borderColor: "rgba(189,242,220,0.85)" }} />
                  )}
                </button>
              );
            }))}
          </div>
          <div className="mt-2 grid grid-cols-8 text-center text-[9px] font-mono text-muted-foreground">
            {"abcdefgh".split("").map(f => <span key={f}>{f}</span>)}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Tap a white piece, then tap a highlighted square. Pawn promotions auto-queen.
        </p>
      </div>
    </div>
  );
}
