import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/eras")({
  component: ErasPage,
  head: () => ({
    meta: [
      { title: "Battle Eras — XOVIA Battle Generations" },
      { name: "description", content: "Preview upcoming Battle Eras: 1920s Flapper, 1970s Funk, 1990s Hip-Hop, 2020s Urban. Licensed celebrity drops, era-exclusive mechanics, founder packs." },
      { property: "og:title", content: "Battle Eras — XOVIA Battle Generations" },
      { property: "og:description", content: "Cross-timeline cards. Licensed celebrity drops. Era-exclusive mechanics. Get notified before launch." },
    ],
  }),
});

type Era = {
  id: string; name: string; tagline: string; description: string;
  launchAt: string; accent: string; glow: string;
  mechanics: string[]; iconCards: string[]; motif: string;
};

const ERAS: Era[] = [
  {
    id: "flapper-1920", name: "1920s Flapper", tagline: "Speakeasy Syndicates",
    description: "Jazz-age duelists, bootleg fortunes, and pearl-strung sorceresses fight across smoke-filled ballrooms.",
    launchAt: new Date(Date.now() + 86400000 * 21).toISOString(),
    accent: "from-amber-200/30 via-amber-500/20 to-rose-400/20",
    glow: "shadow-[0_0_80px_-10px_oklch(0.78_0.16_75/0.45)]",
    mechanics: ["Bootleg Economy — buyout properties for 50% off", "Speakeasy: hidden cards reveal on combat", "Charleston Combo: chain 3 cards = +30% ATK"],
    iconCards: ["The Bootlegger", "Pearl Empress", "Tommy Gun Tycoon", "Jazz Diva"],
    motif: "🎷",
  },
  {
    id: "funk-1970", name: "1970s Funk", tagline: "Cosmic Soul Riders",
    description: "Afrofuturist warriors with bass-cannons and platform-soled sorcery. Every duel rides a synth riff.",
    launchAt: new Date(Date.now() + 86400000 * 42).toISOString(),
    accent: "from-fuchsia-500/30 via-purple-500/20 to-orange-400/20",
    glow: "shadow-[0_0_80px_-10px_oklch(0.62_0.27_330/0.5)]",
    mechanics: ["Groove Meter: build combo points each turn", "Disco Inferno: AOE 3 dmg on full meter", "Funk Resurrection: revive once per match"],
    iconCards: ["Soul Pharaoh", "Roller-Disco Witch", "Cosmic Slinger", "Wah-Wah Warlord"],
    motif: "🪩",
  },
  {
    id: "hiphop-1990", name: "1990s Hip-Hop", tagline: "Boom-Bap Battle Royale",
    description: "Cipher-mages and turntable titans. Verses cast spells. Beats break boards. This is the licensed-icon era.",
    launchAt: new Date(Date.now() + 86400000 * 60).toISOString(),
    accent: "from-emerald-500/30 via-yellow-500/20 to-rose-500/20",
    glow: "shadow-[0_0_80px_-10px_oklch(0.70_0.20_150/0.5)]",
    mechanics: ["Cipher Mode: 1v1v1v1 free-for-all", "Sample Steal: copy opponent's last card", "Mic Drop: KO finisher at <10% HP"],
    iconCards: ["The Lyricist King", "Boom-Bap Oracle", "Turntable Titan", "Cipher Queen"],
    motif: "🎤",
  },
  {
    id: "urban-2020", name: "2020s Urban", tagline: "Neon Streets, Crypto Crowns",
    description: "Drill-bass sorcerers, drip-clad CEOs, and influencer-mages. The current age — where mogul cards print money.",
    launchAt: new Date(Date.now() + 86400000 * 85).toISOString(),
    accent: "from-cyan-500/30 via-blue-500/20 to-violet-500/20",
    glow: "shadow-[0_0_80px_-10px_oklch(0.72_0.20_220/0.5)]",
    mechanics: ["Drip Stat: cosmetics give +ATK", "Viral Spread: card buffs neighbors on play", "Mogul Mode: stake EXOD for in-match buffs"],
    iconCards: ["The CEO", "Drill Wraith", "Influencer Phantom", "Crypto Crown"],
    motif: "💎",
  },
];

function useCountdown(iso: string) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    done: diff === 0,
  };
}

function CountdownPill({ iso }: { iso: string }) {
  const { d, h, m, s, done } = useCountdown(iso);
  if (done) return <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-display tracking-widest text-gold">LIVE</span>;
  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/80">
      <Unit n={d} l="d" /><Unit n={h} l="h" /><Unit n={m} l="m" /><Unit n={s} l="s" />
    </div>
  );
}
function Unit({ n, l }: { n: number; l: string }) {
  return <span className="rounded bg-card/70 px-1.5 py-0.5">{String(n).padStart(2, "0")}<span className="ml-0.5 text-muted-foreground">{l}</span></span>;
}

function ErasPage() {
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState<string>(ERAS[2].id);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Drop a real email, duelist."); return; }
    setSending(true);
    const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase(), source: `era:${chosen}` });
    setSending(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) { toast.error(error.message); return; }
    toast.success("You're on the list. First-pack priority secured.");
    setEmail("");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_20%,oklch(0.62_0.20_255/0.18),transparent_70%)]" />
        <div className="container relative mx-auto px-4 py-16 text-center">
          <div className="text-[11px] uppercase tracking-[0.45em] text-gold">Coming Soon</div>
          <h1 className="mt-3 font-display text-4xl md:text-6xl text-gradient-gold">Battle Eras</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">
            Cross-timeline cards. Licensed celebrity drops. Era-exclusive mechanics. Pick your era, get on the list, and grab founder-tier packs before public launch.
          </p>
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-card/60 border-border/70" />
            <Button type="submit" disabled={sending} className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-wider">
              {sending ? "Sending…" : "Notify Me"}
            </Button>
          </form>
          <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2">
            {ERAS.map((e) => (
              <button type="button" key={e.id} onClick={() => setChosen(e.id)}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${chosen === e.id ? "border-gold/70 bg-gold/10 text-gold" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                {e.motif} {e.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {ERAS.map((era) => (
            <article key={era.id} className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 transition hover:border-gold/40 ${era.glow}`}>
              <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${era.accent} blur-2xl opacity-60 transition group-hover:opacity-90`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">{era.tagline}</div>
                    <h2 className="mt-1 font-display text-2xl md:text-3xl text-gradient-gold">{era.motif} {era.name}</h2>
                  </div>
                  <CountdownPill iso={era.launchAt} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{era.description}</p>
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Era Mechanics</div>
                  <ul className="mt-2 space-y-1 text-xs text-foreground/85">
                    {era.mechanics.map((m) => (<li key={m} className="flex gap-2"><span className="text-gold">◆</span>{m}</li>))}
                  </ul>
                </div>
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Icon Cards</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {era.iconCards.map((c) => (<span key={c} className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px]">{c}</span>))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Founder packs · Licensed drops</span>
                  <button onClick={() => setChosen(era.id)} className="text-[11px] font-display tracking-wider text-gold hover:underline">PICK THIS ERA →</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-gold/30 bg-card/40 p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold">Licensed Drops</div>
          <h3 className="mt-2 font-display text-2xl md:text-3xl text-gradient-gold">Your face. Battle-card immortal.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Artists, athletes, founders, influencers — license your likeness as an era-exclusive card. Limited mint, royalty share, and your fans collect you to fight with.
          </p>
          <a href="mailto:licensing@exodianftbattle.com" className="mt-5 inline-block">
            <Button variant="outline" className="border-gold/60 text-gold hover:bg-gold/10 font-display tracking-wider">Apply for Licensing</Button>
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
