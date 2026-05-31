import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CARDS, ABILITY_GLOSSARY } from "@/data/cards";
import { CardTile } from "@/components/CardTile";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/codex")({
  component: CodexPage,
  head: () => ({
    meta: [
      { title: "Codex — The Complete Exodia Card Library" },
      { name: "description", content: "Every card in the Exodia universe. Search the dynasty, study the lore, and learn the stats before you summon." },
      { property: "og:title", content: "Codex — Exodia NFT Battle" },
      { property: "og:description", content: "Searchable library of every Exodia card and its lore." },
      { property: "og:url", content: "/codex" },
    ],
    links: [{ rel: "canonical", href: "/codex" }],
  }),
});

function CodexPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => CARDS.filter((c) =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.lore.toLowerCase().includes(q.toLowerCase()) || c.set.toLowerCase().includes(q.toLowerCase())
  ), [q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-card/40 py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Hidden Library</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Codex of the Dynasty</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">Every card ever struck, from common scarab warriors to the Forbidden God himself.</p>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, lore, or set…"
            className="mt-6 max-w-md border-border/70 bg-background/60"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((c, i) => (
            <CardTile key={c.id} card={c} index={i} />
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Glossary of Powers</div>
          <h2 className="mt-2 font-display text-3xl text-gradient-gold">Codex of Abilities</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every Egyptian-named effect explained. If a card says it, this is what happens.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ABILITY_GLOSSARY).map(([kind, def]) => (
              <div key={kind} className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="font-display text-base text-gradient-gold">{def.term}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{kind}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{def.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}