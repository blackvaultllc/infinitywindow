import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CARDS, RARITIES, TYPES, rarityLabel, type Rarity, type CardType } from "@/data/cards";
import { CardTile } from "@/components/CardTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vault")({
  component: VaultPage,
  head: () => ({
    meta: [
      { title: "Vault — Your Exodia Card Collection" },
      { name: "description", content: "Browse, filter, and inspect every card in your Exodia vault. Mint to NFT, list for trade, or review divine stats and lore." },
      { property: "og:title", content: "Vault — Exodia NFT Battle" },
      { property: "og:description", content: "Your personal Egyptian god card collection." },
      { property: "og:url", content: "/vault" },
    ],
    links: [{ rel: "canonical", href: "/vault" }],
  }),
});

function VaultPage() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<Rarity | "All">("All");
  const [type, setType] = useState<CardType | "All">("All");
  const [onlyOwned, setOnlyOwned] = useState(true);
  const [tab, setTab] = useState<string>("all");

  // Tabs group several types into one button (e.g. "Spells & Traps" = Spell|Trap|Seal).
  const TAB_GROUPS: Record<string, CardType[] | null> = {
    all: null,
    gods: ["God"],
    spells: ["Spell", "Trap", "Seal"],
    beasts: ["Beast"],
    warriors: ["Warrior", "Mage"],
    fields: ["Field"],
    relics: ["Relic"],
  };

  // Ownership is per-user. Until a real inventory table is wired in, only the
  // owner/admin sees the full roster; everyone else starts with an empty vault
  // and earns cards through packs, drops, and play.
  const ownsCard = (c: typeof CARDS[number]) => isAdmin;

  const filtered = useMemo(() => CARDS.filter((c) => {
    const owned = ownsCard(c);
    if (onlyOwned && !owned) return false;
    if (rarity !== "All" && c.rarity !== rarity) return false;
    if (type !== "All" && c.type !== type) return false;
    const allowedTypes = TAB_GROUPS[tab];
    if (allowedTypes && !allowedTypes.includes(c.type)) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, rarity, type, onlyOwned, tab, isAdmin]);

  // Counts shown on each tab so the player can read their collection at a glance.
  const tabCount = (key: string) => {
    const types = TAB_GROUPS[key];
    return CARDS.filter((c) => (!onlyOwned || ownsCard(c)) && (!types || types.includes(c.type))).length;
  };

  const ownedCount = CARDS.filter(ownsCard).length;
  const relicCount = CARDS.filter((c) => ownsCard(c) && c.rarity === "Exodius").length;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border/60 bg-card/40 py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Sacred Vault</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Your Collection</h1>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <Stat n={ownedCount} l="Cards Owned" />
            <Stat n={relicCount} l="Exodia Relics" suffix="/ 5" accent />
            <Stat n={CARDS.filter((c) => ownsCard(c) && c.rarity === "Legendary").length} l="Legendaries" />
            <Stat n={Math.round(CARDS.filter(ownsCard).reduce((s, c) => s + (c.price ?? 0), 0) / 1000)} l="K EXOD value" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="flex w-full flex-wrap gap-1 bg-card/40 p-1">
            <TabsTrigger value="all">Mine ({tabCount("all")})</TabsTrigger>
            <TabsTrigger value="gods">Gods ({tabCount("gods")})</TabsTrigger>
            <TabsTrigger value="spells">Spells & Traps ({tabCount("spells")})</TabsTrigger>
            <TabsTrigger value="beasts">Beasts ({tabCount("beasts")})</TabsTrigger>
            <TabsTrigger value="warriors">Warriors & Mages ({tabCount("warriors")})</TabsTrigger>
            <TabsTrigger value="fields">Fields ({tabCount("fields")})</TabsTrigger>
            <TabsTrigger value="relics">Relics ({tabCount("relics")})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs border-border/70 bg-background/60"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Pill active={onlyOwned} onClick={() => setOnlyOwned((v) => !v)}>Owned only</Pill>
            <Divider />
            <Pill active={rarity === "All"} onClick={() => setRarity("All")}>All rarity</Pill>
            {RARITIES.map((r) => (
              <Pill key={r} active={rarity === r} onClick={() => setRarity(r)}>{rarityLabel(r)}</Pill>
            ))}
            <Divider />
            <Pill active={type === "All"} onClick={() => setType("All")}>All types</Pill>
            {TYPES.map((t) => (
              <Pill key={t} active={type === t} onClick={() => setType(t)}>{t}</Pill>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-card/40 p-16 text-center text-muted-foreground">
            No cards match these filters. The desert wind keeps its secrets.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((c, i) => (
              <CardTile key={c.id} card={{ ...c, owned: ownsCard(c) }} index={i} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ n, l, suffix, accent }: { n: number; l: string; suffix?: string; accent?: boolean }) {
  return (
    <div>
      <div className={cn("font-display text-3xl", accent ? "text-accent" : "text-gold")}>
        {n}{suffix && <span className="text-base text-muted-foreground"> {suffix}</span>}
      </div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{l}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border-border/60 text-xs tracking-wide",
        active && "border-gold/70 bg-gold/10 text-gold hover:bg-gold/15",
      )}
    >{children}</Button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border/70" aria-hidden />;
}