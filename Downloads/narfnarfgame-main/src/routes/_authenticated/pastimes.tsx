import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Box } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pastimes")({
  head: () => ({
    meta: [
      { title: "Pastimes — Narf Narf" },
      { name: "description", content: "Off-mission mini-games: Chess and the Cube." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PastimesIndex,
});

function PastimesIndex() {
  return (
    <div className="min-h-dvh px-4 py-6 pb-24 md:pb-10" style={{ background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>NARF NARF · PASTIMES</div>
            <h1 className="mt-1 font-display text-3xl tracking-tight">OFF-MISSION</h1>
          </div>
          <Link to="/select" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">← BACK</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PastimeCard to="/pastimes/chess" label="CHESS" body="Quick game vs. tactical AI." icon={<Crown className="h-5 w-5" />} accent="#EF9F27" />
          <PastimeCard to="/pastimes/cube" label="CUBE" body="3×3 puzzle. Scramble & solve." icon={<Box className="h-5 w-5" />} accent="#378ADD" />
        </div>
      </div>
    </div>
  );
}

function PastimeCard({ to, label, body, icon, accent }: { to: any; label: string; body: string; icon: any; accent: string }) {
  return (
    <Link to={to} className="block rounded-2xl border p-5 transition active:scale-[0.98]" style={{ borderColor: `${accent}55`, background: `${accent}10`, boxShadow: `0 0 22px ${accent}22` }}>
      <div className="flex items-center gap-2" style={{ color: accent }}>{icon}<span className="font-display tracking-[0.3em] text-sm">{label}</span></div>
      <p className="mt-2 text-[12px] text-muted-foreground">{body}</p>
    </Link>
  );
}
