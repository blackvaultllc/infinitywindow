import { useEffect, useState } from "react";

export interface CutsceneBeat {
  tag?: string;
  title: string;
  body?: string;
  ms?: number;
}

/**
 * Drop-in cinematic overlay. Use to interrupt gameplay for a story beat:
 *
 *   <Cutscene beats={[...]} onDone={() => setRunning(false)} />
 *
 * Auto-advances on each beat's `ms` (default 3500). Tap to skip a beat,
 * press ESC to skip the whole sequence.
 */
export function Cutscene({ beats, onDone }: { beats: CutsceneBeat[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const beat = beats[i];
  useEffect(() => {
    if (!beat) return;
    const t = setTimeout(() => {
      if (i + 1 >= beats.length) onDone();
      else setI(i + 1);
    }, beat.ms ?? 3500);
    return () => clearTimeout(t);
  }, [i, beat, beats.length, onDone]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onDone]);
  if (!beat) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
        animation: "cutscene-in 400ms ease-out",
      }}
      onClick={() => (i + 1 >= beats.length ? onDone() : setI(i + 1))}
    >
      {beat.tag && (
        <div className="font-mono text-[10px] tracking-[0.45em] mb-3" style={{ color: "#E24B4A" }}>
          {beat.tag}
        </div>
      )}
      <h2 className="font-display text-4xl leading-tight tracking-tight max-w-2xl">{beat.title}</h2>
      {beat.body && <p className="mt-5 max-w-xl text-foreground/80 leading-relaxed">{beat.body}</p>}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
        className="absolute top-5 right-5 font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
      >
        SKIP →
      </button>
      <style>{`@keyframes cutscene-in { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}