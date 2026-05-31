import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "EXODIA5 — Mr. Infinity" },
      { name: "description", content: "Hall Family Legacy." },
    ],
    links: [{ rel: "canonical", href: "https://augi.space/" }],
  }),
});

function Index() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center px-6">
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-neon-cyan/70">
          ◆ EXODIA5 ◆
        </div>
        <h1 className="mt-4 font-display text-4xl sm:text-6xl font-black text-neon-gold">
          Loading…
        </h1>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="glass glow-cyan px-8 py-3 font-display text-sm uppercase tracking-[0.3em] text-neon-cyan border border-neon-cyan/60 hover:bg-neon-cyan/10 transition"
          >
            authenticate ▸
          </Link>
          <Link
            to="/games"
            className="glass px-8 py-3 font-display text-sm uppercase tracking-[0.3em] text-neon-gold border border-neon-gold/60 hover:bg-neon-gold/10 transition"
          >
            🎮 kids arcade
          </Link>
        </div>
      </div>
    </main>
  );
}
