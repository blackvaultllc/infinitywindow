import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CARDS } from "@/data/cards";
import { CardTile } from "@/components/CardTile";
import hero from "@/assets/hero-exodius.jpg";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Package, Box, Coins, ShieldCheck, Sparkles, ScrollText } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Exodia NFT Battle — Collect. Battle. Ascend." },
      { name: "description", content: "Enter the arena. Collect Egyptian god cards, summon the five relics of Exodia Prime, and battle for divinity on-chain." },
      { property: "og:title", content: "Exodia NFT Battle" },
      { property: "og:description", content: "An original Egyptian-mythology NFT trading card game by Exodia Holdings LLC." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  const { user } = useAuth();
  const featured = CARDS.filter((c) => c.rarity === "Legendary" || c.rarity === "Divine").slice(0, 4);
  const relics = CARDS.filter((c) => c.rarity === "Exodius");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* LOGGED-OUT VISIBLE SIGNUP BANNER */}
      {!user && (
        <div className="relative z-30 border-b border-gold/40 bg-gradient-to-r from-gold/15 via-accent/10 to-gold/15">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3 text-sm">
              <Gift className="h-5 w-5 text-gold" />
              <span className="text-foreground">
                <span className="font-display text-gold">Sign up free</span> — instantly claim your{" "}
                <span className="text-accent">Starter Deck</span> (20 cards) + 200 EXOD welcome bonus.
              </span>
            </div>
            <div className="flex gap-2">
              <Link to="/auth"><Button className="bg-gold text-gold-foreground hover:bg-gold/90 glow-gold">Claim Starter Deck</Button></Link>
              <Link to="/auth"><Button variant="outline" className="border-gold/60 text-gold hover:bg-gold/10">Log in</Button></Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <motion.img
          src={hero}
          alt="Exodia Prime rising over the pyramids at dusk"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.55, 0.8, 0.55], scale: [1, 1.04, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_hsl(var(--gold)/0.25),_transparent_60%)]"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="hieroglyph-bg absolute inset-0 -z-10 opacity-40" />

        <div className="container mx-auto grid min-h-[88vh] place-items-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Sponsored by Exodia Holdings LLC
            </div>
            <h1 className="font-display text-5xl leading-tight md:text-7xl">
              <span className="text-gradient-gold">Summon the</span>
              <br />
              <span className="text-foreground">Forbidden God.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              A cinematic Egyptian-mythology card game and NFT marketplace.
              Collect Gods, gather the five relics of <span className="text-accent">Exodia Prime</span>,
              and ascend to unstoppable.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 glow-gold">
                <Link to="/arena">Enter the Arena</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                <Link to="/vault">Open Your Vault</Link>
              </Button>
            </div>
            <p className="mt-8 text-xs uppercase tracking-[0.4em] text-muted-foreground">Collect · Battle · Ascend</p>
          </motion.div>
        </div>
      </section>

      {/* RELICS TEASER */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-accent">The Forbidden Five</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Relics of Exodia Prime</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Gather all five and the game ends in your favor. Each relic is a one-of-one Exodia-tier NFT —
              the most coveted summon in the universe.
            </p>
          </div>
          <Link to="/codex" className="hidden text-sm text-gold hover:underline md:inline">View Codex →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {relics.map((c, i) => (
            <CardTile key={c.id} card={c} index={i} />
          ))}
        </div>
      </section>

      {/* FEATURED GODS */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Featured</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Gods of the Dynasty</h2>
          </div>
          <Link to="/vault" className="text-sm text-gold hover:underline">Browse Vault →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((c, i) => (
            <CardTile key={c.id} card={c} index={i} />
          ))}
        </div>
      </section>

      {/* MINT MARKETPLACE PROMO */}
      <section className="relative isolate overflow-hidden border-y border-gold/30 bg-gradient-to-b from-background via-card/40 to-background py-20">
        <div className="hieroglyph-bg absolute inset-0 -z-10 opacity-20" />
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Now Minting</div>
            <h2 className="mt-2 font-display text-3xl md:text-5xl text-gradient-gold">Own a Piece of the Dynasty</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Buy mint packs and limited boxes, earn EXOD through duels, or purchase the exact digital card you covet.
              Three paths — one pantheon.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {/* PACKS */}
            <motion.div
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-xl border border-gold/40 bg-card/70 p-6 backdrop-blur"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/20" />
              <Package className="h-8 w-8 text-gold" />
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-gold">
                <Sparkles className="h-3 w-3" /> Mint Packs
              </div>
              <h3 className="mt-3 font-display text-2xl">Booster Packs</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                5 cards per pack. Guaranteed Rare+. Chance at Legendary, Divine, and ultra-rare Exodia relics.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">From <span className="text-gold font-display text-base">100 EXOD</span></div>
              <Button asChild className="mt-5 w-full bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/drops">Open the Drop Center</Link>
              </Button>
            </motion.div>

            {/* BOXES */}
            <motion.div
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-xl border border-accent/40 bg-card/70 p-6 backdrop-blur"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-accent/20" />
              <Box className="h-8 w-8 text-accent" />
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-accent">
                <Sparkles className="h-3 w-3" /> Mint Boxes
              </div>
              <h3 className="mt-3 font-display text-2xl">Rarity Boxes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Common · Rare · Legendary · Divine tiers. Each box guarantees rarity-floor pulls plus bonus shards.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">From <span className="text-accent font-display text-base">500 EXOD</span></div>
              <Button asChild variant="outline" className="mt-5 w-full border-accent/60 text-accent hover:bg-accent/10">
                <Link to="/marketplace">Browse Marketplace</Link>
              </Button>
            </motion.div>

            {/* EARN */}
            <motion.div
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card/70 p-6 backdrop-blur"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <Coins className="h-8 w-8 text-foreground" />
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Free to Play
              </div>
              <h3 className="mt-3 font-display text-2xl">Earn by Duelling</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Win battles, level up, complete achievements. Earn EXOD and pack credits without spending a dime.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">Up to <span className="font-display text-base text-foreground">1,000 EXOD / day</span></div>
              <Button asChild variant="outline" className="mt-5 w-full border-border hover:bg-muted/50">
                <Link to="/arena">Enter the Arena</Link>
              </Button>
            </motion.div>
          </div>

          {/* DUAL CTA BANNER */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gold/40 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 p-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Limited Drop Live</div>
                <div className="font-display text-lg">Dynasty Genesis Pack — 1,000 minted</div>
              </div>
              <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/drops">Mint Now</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-gradient-to-r from-accent/10 via-transparent to-accent/10 p-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-accent">Premium Box</div>
                <div className="font-display text-lg">Divine Reliquary Box — 1-of-100</div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-accent/60 text-accent hover:bg-accent/10">
                <Link to="/marketplace">Reserve</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="container mx-auto grid gap-4 px-4 py-16 md:grid-cols-3">
        {[
          { t: "Mint", d: "Forge any card you own into an official on-chain NFT through Exodia Mint Studio." },
          { t: "Battle", d: "Phase-based duels: Draw, Summon, Battle, End. Reduce your foe to zero — or summon Exodia." },
          { t: "Trade", d: "Marketplace with EXOD token, ETH, and a full trade-offer system, à la your favorite digital vault." },
        ].map((p) => (
          <div key={p.t} className="rounded-lg border border-border/60 bg-card/60 p-6 backdrop-blur">
            <div className="font-display text-xl text-gold">{p.t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </section>

      {/* LEGAL / TRUST STRIP */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 text-gold" />
              <div className="max-w-2xl text-sm text-muted-foreground">
                <div className="font-display text-base text-foreground">Operated by Exodia Holdings LLC</div>
                <p className="mt-1">
                  Digital cards, EXOD utility tokens, and NFT relics sold on this platform are collectible digital
                  items intended for entertainment. Pulls are governed by published rarity odds. No purchase is
                  required to play. Void where prohibited. You must be 18+ (or the age of majority in your
                  jurisdiction) to purchase. All sales final on minted items.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="border-border">
                <Link to="/terms"><ScrollText className="mr-2 h-4 w-4" /> Terms & Conditions</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-border">
                <Link to="/terms" hash="privacy">Privacy</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-border">
                <Link to="/terms" hash="odds">Pull Rates</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
