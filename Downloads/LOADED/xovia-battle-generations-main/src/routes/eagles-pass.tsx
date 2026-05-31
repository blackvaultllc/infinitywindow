import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroEagles from "@/assets/hero-eagles-pass.jpg";

export const Route = createFileRoute("/eagles-pass")({
  component: EaglesPassPage,
  head: () => ({
    meta: [
      { title: "The Eagle's Pass — Stake Your Sacred Ground" },
      { name: "description", content: "The Eagle's Pass is the great trade causeway of the Exodia universe. Learn how dynasties stake ground, raise temples, and command the flow of the dynasty." },
      { property: "og:title", content: "The Eagle's Pass — Exodia NFT Battle" },
      { property: "og:description", content: "Where dynasties claim sacred ground and direct the flow of the dynasty." },
      { property: "og:image", content: heroEagles },
      { property: "og:url", content: "/eagles-pass" },
    ],
    links: [{ rel: "canonical", href: "/eagles-pass" }],
  }),
});

const STAGES = [
  {
    n: "I",
    title: "The Open Sands",
    body: "Before any dynasty rises, the Pass is only wind and dirt. Endless ground that belongs to no one — and so, in truth, belongs to anyone bold enough to plant a stone.",
  },
  {
    n: "II",
    title: "The First Marker",
    body: "A duelist sets a single obelisk. That marker is their claim — their grounds along the busy causeway. Travelers begin to slow as they pass. Word spreads. The marker becomes a name.",
  },
  {
    n: "III",
    title: "Raising the Temple",
    body: "Around the marker, the duelist builds. Walls of sandstone, prayer halls, halls of cards. Each addition draws more pilgrims, more rivals, more eyes. This is the work — quiet logistics that turn ground into a destination.",
  },
  {
    n: "IV",
    title: "The Quarter Awakens",
    body: "Soon other duelists raise their own temples nearby. The Pass becomes a quarter. One unoccupied plot between two thriving temples is the most valuable ground in the dynasty — every traveler who passes will see it.",
  },
  {
    n: "V",
    title: "Commanding the Flow",
    body: "Eventually the strongest temples decide which travelers move, which rest, which kneel. Their banner becomes a brand. Their cards become legend. The Pass remembers only those who built well.",
  },
] as const;

function EaglesPassPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <img
          src={heroEagles}
          alt="The Eagle's Pass at golden hour"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="text-xs uppercase tracking-[0.4em] text-accent">Strategy · Lore</div>
            <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl text-gradient-gold">
              The Eagle's Pass
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The great trade causeway of the dynasty. Every duelist who matters has staked their ground along this stone road — raised a temple, lit a brazier, drawn a crowd. This is how legacies are built in Exodia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/simulator">Test Your Cards in the Simulator</Link>
              </Button>
              <Button asChild variant="outline" className="border-gold/60 text-gold hover:bg-gold/10">
                <Link to="/vault">Open the Vault</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The five stages */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">The Five Stages of the Pass</div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl text-gradient-gold">
            From dirt road to dynasty seat
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A teaching parable, told the way the old priests of Karnak tell it — how empty ground becomes a destination, and a destination becomes a name.
          </p>
        </div>

        <ol className="relative space-y-10 border-l border-gold/30 pl-8">
          {STAGES.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative"
            >
              <span className="absolute -left-[2.7rem] flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-background font-display text-sm text-gold glow-gold">
                {s.n}
              </span>
              <h3 className="font-display text-xl text-foreground">{s.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* What this means for the duelist */}
      <section className="border-t border-border/60 bg-card/40 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <Pillar
              kicker="Claim"
              title="Stake your ground"
              body="Mint the cards that will mark your temple. Your collection is your obelisk in the sand — visible to every duelist who walks the Pass."
            />
            <Pillar
              kicker="Build"
              title="Strengthen the temple"
              body="Trade up. Refine your deck. Test combinations in the simulator until your roster commands respect on sight."
            />
            <Pillar
              kicker="Command"
              title="Direct the flow"
              body="When your cards become legend, the dynasty bends toward your gate. Duelists come to challenge, to study, to trade — and the Pass remembers your name."
            />
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-crimson text-foreground hover:bg-crimson/90">
              <Link to="/simulator">Enter the Simulator</Link>
            </Button>
            <Button asChild variant="outline" className="border-border/70">
              <Link to="/codex">Study the Codex</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Pillar({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-6 hieroglyph-bg">
      <div className="text-[10px] uppercase tracking-[0.3em] text-accent">{kicker}</div>
      <h3 className="mt-2 font-display text-xl text-gradient-gold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
