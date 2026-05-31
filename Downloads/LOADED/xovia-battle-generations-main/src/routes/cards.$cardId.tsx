import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  CARDS,
  getCardById,
  elementOf,
  ELEMENT_META,
  effectTierOf,
  EFFECT_TIER_META,
  ABILITY_GLOSSARY,
  type Card,
} from "@/data/cards";

export const Route = createFileRoute("/cards/$cardId")({
  loader: ({ params }) => {
    const card = getCardById(params.cardId);
    if (!card) throw notFound();
    return { card };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.card;
    const title = c ? `${c.name} — ${c.rarity} ${c.type} | Exodia Codex` : "Card | Exodia";
    const desc = c
      ? `${c.name}: ${c.rarity} ${c.type} from ${c.set}. ATK ${c.atk} / DEF ${c.def}. ${c.ability ? c.ability.name + " — " + c.ability.description : c.lore.slice(0, 120)}`
      : "Card detail.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(c?.art ? [{ property: "og:image", content: c.art }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-gradient-gold">Card not found</h1>
        <p className="mt-3 text-muted-foreground">The dynasty has no record of that relic.</p>
        <Link to="/codex" className="mt-6 inline-block text-gold underline">Return to the Codex</Link>
      </div>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-destructive">{error.message}</p>
      </div>
      <SiteFooter />
    </div>
  ),
  component: CardDetailPage,
});

function CardDetailPage() {
  const { card } = Route.useLoaderData();
  const element = elementOf(card);
  const elMeta = ELEMENT_META[element];
  const tier = effectTierOf(card);
  const tierMeta = EFFECT_TIER_META[tier];

  // Cards this one has an elemental advantage against (sample first 6)
  const counterIds = elMeta.counters;
  const targets = CARDS.filter((c) => counterIds.includes(elementOf(c)) && c.id !== card.id).slice(0, 6);

  // Related cards from same set
  const related = CARDS.filter((c) => c.set === card.set && c.id !== card.id).slice(0, 6);

  const glossary = card.ability ? ABILITY_GLOSSARY[card.ability.kind as keyof typeof ABILITY_GLOSSARY] : undefined;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="container mx-auto px-4 pt-4 text-xs text-muted-foreground">
        <Link to="/codex" className="hover:text-gold">← Back to Codex</Link>
        <span className="mx-2 opacity-40">/</span>
        <span className="text-foreground">{card.name}</span>
      </div>

      <section className="container mx-auto grid gap-6 px-4 py-6 md:grid-cols-[minmax(0,1fr)_1.2fr] md:py-10">
        {/* ── Card art panel ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, rotateY: -10 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-lg", `card-frame-${card.rarity}`)}
        >
          <img src={card.art} alt={card.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <span className={cn("rounded-md border px-2 py-1 text-xs backdrop-blur bg-background/70", elMeta.tint, elMeta.color)}>
              {elMeta.glyph} {element}
            </span>
            {tier !== "None" && (
              <span className={cn("rounded-md border border-border/60 bg-background/70 px-2 py-1 text-xs backdrop-blur", tierMeta.color)}>
                {tierMeta.glyph} {tier} Effect
              </span>
            )}
          </div>
          {card.ownerOnly && (
            <div className="absolute left-3 top-3 rounded-md border border-accent/70 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-accent backdrop-blur">
              Pharaoh-Locked
            </div>
          )}
        </motion.div>

        {/* ── Detail panel ───────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(
                "border tracking-[0.18em]",
                card.rarity === "Exodius" && "border-accent/70 text-accent",
                card.rarity === "Legendary" && "border-gold/70 text-gold",
                card.rarity === "Divine" && "border-silver/60 text-silver",
                card.rarity === "Rare" && "border-bronze/70 text-bronze",
                card.rarity === "Common" && "border-stone/70 text-muted-foreground",
              )}>{card.rarity}</Badge>
              <Badge variant="secondary">{card.type}</Badge>
              <Badge variant="secondary">{card.set}</Badge>
              {card.variant && <Badge variant="outline" className="border-accent/50 text-accent">{card.variant}</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-5xl text-gradient-gold">{card.name}</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 rounded-md border border-border/60 bg-card/40 p-3 text-center">
            <Stat label="ATK" value={card.atk} accent="text-gold" />
            <Stat label="DEF" value={card.def} accent="text-silver" />
            <Stat label="DIVINITY" value={card.divinity} accent="text-accent" />
            <Stat label="ELEMENT" valueText={`${elMeta.glyph} ${element}`} accent={elMeta.color} />
          </div>

          {/* Lore */}
          <div className="rounded-md border border-border/60 bg-card/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Lore</div>
            <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground">&ldquo;{card.lore}&rdquo;</p>
          </div>

          {/* Ability */}
          {card.ability ? (
            <div className="rounded-md border border-accent/40 bg-accent/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent">Active Ability</span>
                  <span className="font-display text-lg text-gradient-gold">{card.ability.name}</span>
                </div>
                <span className={cn("text-xs", tierMeta.color)}>{tierMeta.glyph} {tier}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{card.ability.description}</p>
              {glossary && (
                <p className="mt-2 border-t border-accent/20 pt-2 text-[11px] text-muted-foreground">
                  <span className="text-gold">{glossary.term}:</span> {glossary.meaning}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              This card has no active ability — it relies on raw stats and elemental matchup.
            </div>
          )}

          {/* Elemental matchup */}
          <div className="rounded-md border border-border/60 bg-card/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Elemental Matchup</div>
            <p className="mt-1 text-sm text-foreground/90">
              <span className={elMeta.color}>{elMeta.glyph} {element}</span>{" "}
              {elMeta.counters.length > 0 ? (
                <>has the upper hand against{" "}
                {elMeta.counters.map((e, i) => (
                  <span key={e}>
                    <span className={ELEMENT_META[e].color}>{ELEMENT_META[e].glyph} {e}</span>
                    {i < elMeta.counters.length - 1 ? ", " : ""}
                  </span>
                ))}
                . Winning a duel where this card defeats one of those grants bonus XP.</>
              ) : "stands neutral against all elements."}
            </p>
          </div>

          {/* Market actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-card/30 p-4">
            <div className="text-xs text-muted-foreground">
              {card.ownerOnly
                ? <span className="text-accent">Locked to the Pharaoh — not for sale.</span>
                : card.owned
                  ? <span className="text-foreground">In your vault</span>
                  : <>Listed at <span className="text-gold">{card.price?.toLocaleString()} EXOD</span></>}
            </div>
            <div className="flex gap-2">
              <Link to="/marketplace" className="inline-flex items-center justify-center rounded-md border border-border/70 px-3 py-1.5 text-xs hover:border-gold/60">Back to Market</Link>
              <Link to="/arena" className="inline-flex items-center justify-center rounded-md bg-gold px-3 py-1.5 text-xs text-gold-foreground hover:bg-gold/90">Take to Arena</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Counters this card preys on ───────────────────── */}
      {targets.length > 0 && (
        <section className="container mx-auto px-4 pb-8">
          <h2 className="font-display text-xl text-gradient-gold">Strong Against</h2>
          <p className="text-xs text-muted-foreground">Cards whose element falls to {element}.</p>
          <CardRow cards={targets} />
        </section>
      )}

      {/* ── Same set ──────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <h2 className="font-display text-xl text-gradient-gold">Also in &ldquo;{card.set}&rdquo;</h2>
          <CardRow cards={related} />
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, valueText, accent }: { label: string; value?: number; valueText?: string; accent: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("font-display text-lg md:text-xl", accent)}>{valueText ?? value}</div>
    </div>
  );
}

function CardRow({ cards }: { cards: Card[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {cards.map((c) => {
        const el = ELEMENT_META[elementOf(c)];
        return (
          <Link
            key={c.id}
            to="/cards/$cardId"
            params={{ cardId: c.id }}
            className={cn("group relative aspect-[3/4] overflow-hidden rounded-md border border-border/50 bg-card/40 transition hover:border-gold/50", `card-frame-${c.rarity}`)}
          >
            <img src={c.art} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
            <div className={cn("absolute right-1 top-1 rounded-sm border px-1 py-0.5 text-[9px] backdrop-blur bg-background/60", el.tint, el.color)}>{el.glyph}</div>
            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="font-display text-xs leading-tight text-foreground line-clamp-2">{c.name}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}