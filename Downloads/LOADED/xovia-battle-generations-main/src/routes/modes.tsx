import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Flame, Lock, Swords, Trophy } from "lucide-react";

export const Route = createFileRoute("/modes")({
  component: ModesPage,
  head: () => ({
    meta: [
      { title: "Game Modes — XOVIA Battle Generations" },
      { name: "description", content: "Sacred Forge, Tomb-Sealed Mode, Weekend War, and Ranked Progression — competitive duel formats with weekly rewards and seasonal climbs." },
      { property: "og:title", content: "Game Modes — XOVIA" },
      { property: "og:description", content: "Forge legendary cards, draft sealed pools, climb ranked, and dominate the Weekend War." },
    ],
  }),
});

const RANKS = [
  { name: "Bronze", color: "text-amber-700", req: 0 },
  { name: "Silver", color: "text-zinc-300", req: 250 },
  { name: "Gold", color: "text-gold", req: 600 },
  { name: "Lapis", color: "text-blue-400", req: 1100 },
  { name: "Obsidian", color: "text-purple-400", req: 1800 },
  { name: "Pharaoh", color: "text-gradient-gold", req: 2700 },
];

function ModesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-14">
        <div className="text-[11px] uppercase tracking-[0.45em] text-gold">Competitive</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Game Modes</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Four formats. One ladder. Climb the ranks, forge what others can't, and bank seasonal rewards every Sunday at midnight Cairo time.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ModeCard
            icon={<Flame className="h-5 w-5" />} accent="from-orange-500/30 to-rose-500/20"
            tag="Crafting" title="Sacred Forge"
            blurb="Burn 4 duplicate cards to forge a new card of the next rarity tier. Forged cards carry a unique Forge Seal — visible in the marketplace, valued 1.5× base."
            bullets={["4 → 1 craft (same rarity merge)", "Forge Seal = +50% market premium", "Legendary forges unlock animated art", "Weekly free forge for Duel Pass holders"]}
            cta={{ label: "Open Forge", to: "/vault" }}
          />
          <ModeCard
            icon={<Lock className="h-5 w-5" />} accent="from-amber-500/25 to-yellow-700/20"
            tag="Limited" title="Tomb-Sealed Mode"
            blurb="Crack a sealed pool of 45 cards. Build a 25-card deck on the spot. Your collection doesn't matter here — only the draft does. Top 3 finishers keep every card they drafted."
            bullets={["3 packs sealed, no outside cards", "Best-of-5 single elimination", "Top 3 keep full draft pool", "Entry: 500 EXOD or 1 Tomb Ticket"]}
            cta={{ label: "Enter Tomb", to: "/tournaments" }}
          />
          <ModeCard
            icon={<Swords className="h-5 w-5" />} accent="from-red-500/30 to-fuchsia-500/20"
            tag="Weekend Event" title="Weekend War"
            blurb="Fri 00:00 → Sun 23:59 Cairo time. Stake EXOD per match, double-or-nothing brackets, and a global leaderboard. Top 100 earn an exclusive cosmetic each week."
            bullets={["Friday → Sunday only", "Escalating wager rounds", "Top 100 → cosmetic + EXOD prize", "Streak bonuses (3 wins = +20% pot)"]}
            cta={{ label: "Find Match", to: "/arena" }}
          />
          <ModeCard
            icon={<Trophy className="h-5 w-5" />} accent="from-blue-500/30 to-cyan-500/20"
            tag="Season" title="Ranked Progression"
            blurb="Climb from Bronze to Pharaoh across a 90-day season. End-of-season rewards scale with peak rank — Pharaoh-tier earns a guaranteed Legendary."
            bullets={["6 tiers, 5 divisions each", "+25 / -20 EP per match", "Soft reset between seasons", "Pharaoh = 1 guaranteed Legendary + cosmetic"]}
            cta={{ label: "Queue Ranked", to: "/arena" }}
          />
        </div>

        <div className="mt-14 rounded-2xl border border-border/60 bg-card/40 p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Ranked Ladder</div>
          <h2 className="mt-1 font-display text-2xl">Season Tiers</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
            {RANKS.map((r) => (
              <div key={r.name} className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                <div className={`font-display text-lg ${r.color}`}>{r.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{r.req} EP</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gold/30 bg-card/40 p-6 text-center">
          <h3 className="font-display text-xl text-gradient-gold">Want a preview of what's next?</h3>
          <p className="mt-2 text-sm text-muted-foreground">Battle Eras are coming — licensed celebrity drops across 4 decades.</p>
          <Link to="/eras" className="mt-4 inline-block">
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-wider">See Battle Eras</Button>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function ModeCard({ icon, accent, tag, title, blurb, bullets, cta }: {
  icon: React.ReactNode; accent: string; tag: string; title: string;
  blurb: string; bullets: string[]; cta: { label: string; to: string };
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 transition hover:border-gold/40">
      <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${accent} blur-2xl opacity-60 transition group-hover:opacity-90`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-gold">{icon}<span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">{tag}</span></div>
        <h2 className="mt-1 font-display text-2xl md:text-3xl text-gradient-gold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{blurb}</p>
        <ul className="mt-4 space-y-1 text-xs text-foreground/85">
          {bullets.map((b) => (<li key={b} className="flex gap-2"><span className="text-gold">◆</span>{b}</li>))}
        </ul>
        <div className="mt-5">
          <Link to={cta.to}>
            <Button variant="outline" className="border-gold/60 text-gold hover:bg-gold/10 font-display tracking-wider">{cta.label}</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
