import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CARDS, RARITIES, TYPES, rarityLabel, type Rarity, type CardType, elementOf, ELEMENT_META, effectTierOf, EFFECT_TIER_META } from "@/data/cards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import heroExodia from "@/assets/hero-exodius.jpg";
import heroEagles from "@/assets/hero-eagles-pass.jpg";
import raArt from "@/assets/card-ra.jpg";
import exHead from "@/assets/card-exodius-head.jpg";

export const Route = createFileRoute("/marketplace")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Marketplace — Trade Exodia NFT Cards & Packs" },
      { name: "description", content: "Browse, buy, and trade Egyptian-themed NFT cards. Open sealed packs from the Golden Age of Ra, Pharaoh's Vault, and more." },
      { property: "og:title", content: "Marketplace — Exodia NFT Battle" },
      { property: "og:description", content: "Buy, sell, and open sealed packs of Exodia NFT cards." },
      { property: "og:url", content: "/marketplace" },
    ],
    links: [{ rel: "canonical", href: "/marketplace" }],
  }),
});

interface PackProduct {
  id: string;
  name: string;
  tagline: string;
  cards: number;
  price: number; // USD
  art: string;
  odds: { rarity: string; pct: string }[];
}

const PACKS: PackProduct[] = [
  {
    id: "pack-genesis",
    name: "Genesis Relic Pack",
    tagline: "First-edition seal of the Forbidden God.",
    cards: 5,
    price: 49.99,
    art: exHead,
    odds: [
      { rarity: "Exodia Relic", pct: "0.04%" },
      { rarity: "Legendary God", pct: "1.0%" },
      { rarity: "Divine", pct: "12%" },
      { rarity: "Rare", pct: "32%" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-golden",
    name: "Golden Age of Ra",
    tagline: "Five sun-blessed cards. Guaranteed one Rare+.",
    cards: 5,
    price: 14.99,
    art: raArt,
    odds: [
      { rarity: "Legendary God", pct: "0.3%" },
      { rarity: "Divine", pct: "5%" },
      { rarity: "Rare (guaranteed ≥1)", pct: "—" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-tomb-sealed",
    name: "Tomb-Sealed Pack",
    tagline: "Eight cards drawn from the Underworld vaults.",
    cards: 8,
    price: 19.99,
    art: heroExodia,
    odds: [
      { rarity: "Legendary God", pct: "0.5%" },
      { rarity: "Divine", pct: "8%" },
      { rarity: "Rare", pct: "25%" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-eagles-pass",
    name: "Eagle's Pass Booster",
    tagline: "Three cards. Cheap entry to the dynasty.",
    cards: 3,
    price: 4.99,
    art: heroEagles,
    odds: [
      { rarity: "Divine", pct: "2%" },
      { rarity: "Rare", pct: "15%" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-underworld",
    name: "Underworld Tribute",
    tagline: "Six cards drawn from Anubis' ledger.",
    cards: 6,
    price: 9.99,
    art: heroExodia,
    odds: [
      { rarity: "Legendary God", pct: "0.4%" },
      { rarity: "Divine", pct: "7%" },
      { rarity: "Rare", pct: "22%" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-pharaohs-seal",
    name: "Pharaoh's Seal",
    tagline: "Premium 10-card vault. Guaranteed one Divine+.",
    cards: 10,
    price: 29.99,
    art: exHead,
    odds: [
      { rarity: "Legendary God", pct: "2%" },
      { rarity: "Divine (guaranteed ≥1)", pct: "—" },
      { rarity: "Rare", pct: "30%" },
      { rarity: "Common", pct: "rest" },
    ],
  },
  {
    id: "pack-trap-seal",
    name: "Seal of Forbidden Traps",
    tagline: "Five cards weighted toward Spells, Traps & Seals.",
    cards: 5,
    price: 12.99,
    art: raArt,
    odds: [
      { rarity: "Divine Seal", pct: "4%" },
      { rarity: "Rare Seal/Trap", pct: "28%" },
      { rarity: "Common Spell", pct: "rest" },
    ],
  },
];

interface BoxProduct {
  id: string;
  name: string;
  tagline: string;
  cards: number;
  price: number;
  art: string;
  guaranteed: string[];
}

const BOXES: BoxProduct[] = [
  {
    id: "box-bronze",
    name: "Bronze Tomb Box",
    tagline: "20 cards. The entry-tier digital box.",
    cards: 20,
    price: 39.99,
    art: heroEagles,
    guaranteed: ["≥3 Rare", "≥1 Divine", "Bonus: 100 EXOD"],
  },
  {
    id: "box-silver",
    name: "Silver Dynasty Box",
    tagline: "20 cards. Built for mid-tier collectors.",
    cards: 20,
    price: 69.99,
    art: raArt,
    guaranteed: ["≥5 Rare", "≥2 Divine", "≥1 Legendary chance 8%", "Bonus: 250 EXOD"],
  },
  {
    id: "box-gold",
    name: "Gold Pharaoh Box",
    tagline: "20 cards. Heirloom-grade pull rates.",
    cards: 20,
    price: 129.99,
    art: exHead,
    guaranteed: ["≥6 Rare", "≥3 Divine", "≥1 Legendary guaranteed", "Exodia Relic chance 0.5%", "Bonus: 600 EXOD"],
  },
  {
    id: "box-genesis",
    name: "Genesis Forbidden Box",
    tagline: "20 cards. The richest digital box in the dynasty.",
    cards: 20,
    price: 249.99,
    art: heroExodia,
    guaranteed: ["≥8 Rare", "≥4 Divine", "≥2 Legendary guaranteed", "Exodia Relic chance 2%", "Bonus: 1500 EXOD"],
  },
];

function MarketplacePage() {
  const [rarity, setRarity] = useState<Rarity | "All">("All");
  const [type, setType] = useState<CardType | "All">("All");
  const [tab, setTab] = useState<"cards" | "packs" | "boxes">("cards");
  const { user } = useAuth();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  const buy = (priceId: string) => {
    if (!user) { toast.error("Sign in to purchase."); return; }
    openCheckout({
      priceId,
      userId: user.id,
      customerEmail: user.email ?? undefined,
    });
  };

  const listings = useMemo(
    () =>
      CARDS.filter(
        (c) =>
          (rarity === "All" || c.rarity === rarity) &&
          (type === "All" || c.type === type),
      ),
    [rarity, type],
  );

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <SiteHeader />

      <section className="border-b border-border/60 bg-card/40 py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Bazaar of the Dynasty</div>
          <h1 className="mt-2 font-display text-3xl md:text-5xl text-gradient-gold">Marketplace</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Acquire relics, dethrone rivals, bid on legendary drops, or tear open sealed packs. Transactions settle in
            EXOD in-game, or USD via secure checkout. Packs and boxes ship instantly to your vault.
          </p>
        </div>
      </section>

      {/* Tab switcher */}
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6 rounded-xl border border-gold/30 bg-card/40 p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold">EXOD Token Bundles</div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {[
              { id: "exod_1000",  label: "1,000 EXOD",  price: "$4.99"   },
              { id: "exod_5000",  label: "5,000 EXOD",  price: "$19.99"  },
              { id: "exod_15000", label: "15,000 EXOD", price: "$49.99"  },
              { id: "exod_50000", label: "50,000 EXOD", price: "$149.99" },
            ].map((b) => (
              <button key={b.id} onClick={() => buy(b.id)}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2 text-left hover:border-gold/60">
                <span className="font-display text-sm text-gradient-gold">{b.label}</span>
                <span className="text-xs text-gold">{b.price}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="inline-flex rounded-md border border-border/60 bg-card/40 p-1">
          {(["cards", "packs", "boxes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded px-4 py-1.5 text-xs uppercase tracking-[0.25em] transition",
                tab === t ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "cards" ? "Single Cards" : t === "packs" ? "Sealed Packs" : "Digital Boxes (20)"}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-3xl text-[11px] text-muted-foreground">
          Earn EXOD by winning duels, climbing ranks, and completing quests — then spend it here, or open packs with EXOD instead of cash.
          Every <span className="text-gold">level-up</span> (profiles cap at 100) drops a free pack into your vault. Past <span className="text-gold">level 50</span>,
          guaranteed-rarity packs start mixing into the rotation, including a 0.5% chance at an Exodia Relic pack.
        </p>
      </div>

      {tab === "cards" ? (
        <section className="container mx-auto grid gap-6 px-4 py-6 md:py-10 lg:grid-cols-[220px_1fr]">
          {/* LEFT — EXOD token panel (kept on desktop, hidden on mobile per request) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-lg border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
              <div className="font-display text-base text-gold">EXOD Token</div>
              <div className="mt-1">1 EXOD ≈ 0.0042 ETH</div>
              <div className="mt-1 opacity-70">Live pricing in Phase&nbsp;2.</div>
              <div className="mt-3 border-t border-border/60 pt-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your balance</div>
                <div className="font-display text-2xl text-foreground">0 <span className="text-xs text-muted-foreground">EXOD</span></div>
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            {/* TOP FILTER BAR (responsive) */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-3">
              <FilterChip
                label="Rarity"
                value={rarity}
                options={["All", ...RARITIES]}
                onChange={(v) => setRarity(v as Rarity | "All")}
              />
              <FilterChip
                label="Type"
                value={type}
                options={["All", ...TYPES]}
                onChange={(v) => setType(v as CardType | "All")}
              />
              <div className="ml-auto text-xs text-muted-foreground">{listings.length} listings</div>
            </div>

            {/* Card grid — responsive (1 col phone, 2 tablet, list on lg) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {listings.map((c) => {
                const el = ELEMENT_META[elementOf(c)];
                const tier = effectTierOf(c);
                const tierMeta = EFFECT_TIER_META[tier];
                return (
                  <Link
                    key={c.id}
                    to="/cards/$cardId"
                    params={{ cardId: c.id }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-left transition hover:border-gold/50",
                      c.rarity === "Exodius" && "border-accent/40",
                    )}
                  >
                    <div className={cn("relative h-20 w-16 shrink-0 overflow-hidden rounded sm:h-24 sm:w-20", `card-frame-${c.rarity}`)}>
                      <img src={c.art} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <span className={cn("absolute right-0.5 top-0.5 rounded-sm px-1 text-[9px] backdrop-blur bg-background/70", el.color)} title={`Element: ${elementOf(c)}`}>{el.glyph}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="font-display text-sm sm:text-base text-foreground truncate">{c.name}</div>
                        {tier !== "None" && (
                          <span title={tierMeta.label} className={cn("text-sm", tierMeta.color)}>{tierMeta.glyph}</span>
                        )}
                      </div>
                      <div className="truncate text-[11px] sm:text-xs text-muted-foreground">
                        {c.type} · {c.set} ·{" "}
                        <span className={cn(
                          c.rarity === "Exodius" ? "text-accent" : c.rarity === "Legendary" ? "text-gold" : "text-muted-foreground",
                        )}>{rarityLabel(c.rarity)}</span>
                      </div>
                      {c.ability && (
                        <div className="mt-0.5 truncate text-[10px] text-accent/80">⚡ {c.ability.name}</div>
                      )}
                    </div>
                    <div className="hidden text-center text-[11px] md:block">
                      <div className="text-muted-foreground">ATK / DEF</div>
                      <div className="font-display text-sm text-foreground">{c.atk} / {c.def}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Price</div>
                      <div className="font-display text-base sm:text-lg text-gold">
                        {c.price?.toLocaleString()}<span className="ml-1 text-[10px] text-muted-foreground">EXOD</span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); buy(c.id.replace(/-/g, "_")); }}
                      className="ml-1 hidden bg-gold text-gold-foreground hover:bg-gold/90 md:inline-flex"
                    >Buy</Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : tab === "packs" ? (
        <section className="container mx-auto px-4 py-6 md:py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PACKS.map((p) => (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-gold/30 bg-card/60 transition hover:border-gold/70">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={p.art} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-gold/60 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-gold backdrop-blur">
                    {p.cards} cards
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="font-display text-lg text-gradient-gold">{p.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground italic">{p.tagline}</div>
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                    {p.odds.map((o) => (
                      <li key={o.rarity} className="flex justify-between"><span>{o.rarity}</span><span className="text-gold/80">{o.pct}</span></li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="font-display text-xl text-gold">${p.price.toFixed(2)}</div>
                    <Button
                      className="bg-gold text-gold-foreground hover:bg-gold/90"
                      onClick={() => buy(p.id.replace(/-/g, "_"))}
                    >Buy Pack</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Drop rates are deterministic, audited, and identical for every account. The Forbidden Card is locked to the owner — it cannot be pulled from any pack.
          </p>
        </section>
      ) : (
        <section className="container mx-auto px-4 py-6 md:py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BOXES.map((b) => (
              <div key={b.id} className="group flex flex-col overflow-hidden rounded-xl border border-accent/30 bg-card/60 transition hover:border-accent/70">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={b.art} alt={b.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-accent/60 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-accent backdrop-blur">
                    {b.cards} cards · keep all
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="font-display text-lg text-gradient-gold">{b.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground italic">{b.tagline}</div>
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                    {b.guaranteed.map((g) => (
                      <li key={g} className="flex items-start gap-1.5"><span className="text-accent">✦</span><span>{g}</span></li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="font-display text-xl text-gold">${b.price.toFixed(2)}</div>
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => buy(b.id.replace(/-/g, "_"))}
                    >Buy Box</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Every card from an opened box is yours forever — list, trade, or auction on the marketplace. The AI sale-estimator suggests a fair price and an expected timeframe (estimate, not a guarantee).
          </p>
        </section>
      )}

      <SiteFooter />
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl p-0 sm:p-0">
          <div className="max-h-[85vh] overflow-y-auto">{checkoutElement}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ label, value, options, onChange }: {
  label: string; value: string; options: readonly string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground focus:border-gold/60 focus:outline-none"
      >
        {options.map((o) => <option key={o} value={o}>{rarityLabel(o)}</option>)}
      </select>
    </div>
  );
}
