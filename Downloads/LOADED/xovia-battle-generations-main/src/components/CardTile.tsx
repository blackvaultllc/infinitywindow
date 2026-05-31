import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  type Card,
  elementOf, ELEMENT_META,
  effectTierOf, EFFECT_TIER_META,
  attributeOf, ATTRIBUTE_META,
  levelOf, monsterTypeOf,
  spellSubtypeOf, trapSubtypeOf, SPELL_SUBTYPE_META, TRAP_SUBTYPE_META,
  displayRarityOf, DISPLAY_RARITY_META,
} from "@/data/cards";
import { cn } from "@/lib/utils";

interface Props {
  card: Card;
  onClick?: () => void;
  index?: number;
  /** If true (default) the tile links to /cards/$id. Pass `false` to use onClick only. */
  asLink?: boolean;
  /** Suppress the special-card glow (used for opponent-side renderings in the arena). */
  noGlow?: boolean;
}

const RARITY_OVERLAY: Record<string, string> = {
  "Super Rare":    "rarity-overlay-super-rare",
  "Ultra Rare":    "rarity-overlay-ultra-rare",
  "Secret Rare":   "rarity-overlay-secret-rare",
  "Ultimate Rare": "rarity-overlay-ultimate-rare",
  "Ghost Rare":    "rarity-overlay-ghost-rare",
};

export function CardTile({ card, onClick, index = 0, asLink = true, noGlow = false }: Props) {
  const element = elementOf(card);
  const elMeta = ELEMENT_META[element];
  const tier = effectTierOf(card);
  const tierMeta = EFFECT_TIER_META[tier];
  const attribute = attributeOf(card);
  const attrMeta = ATTRIBUTE_META[attribute];
  const level = levelOf(card);
  const mtype = monsterTypeOf(card);
  const spellSub = spellSubtypeOf(card);
  const trapSub  = trapSubtypeOf(card);
  const display = displayRarityOf(card);
  const dispMeta = DISPLAY_RARITY_META[display];
  const overlayCls = RARITY_OVERLAY[display] ?? "";

  // Vibrant glow rules — only on the owner's side. Tiered so the rarest cards
  // shine brightest, while owner-only signatures get an unmistakable halo.
  let glowCls = "";
  if (!noGlow) {
    if (card.ownerOnly) glowCls = "card-glow-owner";
    else if (card.rarity === "Exodius") glowCls = "card-glow-owner";
    else if (card.rarity === "Legendary") glowCls = "card-glow-legendary";
    else if (card.rarity === "Divine" && (card.type === "God" || card.type === "Mage")) glowCls = "card-glow-divine";
  }

  const inner = (
    <>
      <img
        src={card.art}
        alt={card.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
      <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
        <span
          title={dispMeta.label}
          className={cn(
            "rounded-sm border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] backdrop-blur",
            dispMeta.color,
          )}
        >
          {dispMeta.label}
        </span>
        {level > 0 && (
          <span
            title={`Level ${level}`}
            className="rounded-sm border border-gold/50 bg-background/60 px-1.5 py-0.5 text-[10px] tracking-wider text-gold backdrop-blur"
          >
            {"★".repeat(Math.min(level, 6))}
            {level > 6 && <span className="ml-0.5">×{level}</span>}
          </span>
        )}
      </div>
      {/* Element + Effect tier badges */}
      <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
        <span
          title={`Attribute: ${attribute}`}
          className={cn("rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur", attrMeta.tint, attrMeta.color)}
        >
          <span className="mr-0.5">{attrMeta.glyph}</span>{attribute}
        </span>
        <span
          title={`Element: ${element} — counters ${elMeta.counters.join(", ") || "none"}`}
          className={cn("rounded-sm border px-1 py-0.5 text-[9px] backdrop-blur bg-background/60", elMeta.tint, elMeta.color)}
        >
          {elMeta.glyph}
        </span>
        {spellSub && (
          <span title={SPELL_SUBTYPE_META[spellSub].label} className="rounded-sm border border-emerald-500/50 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300 backdrop-blur">
            {SPELL_SUBTYPE_META[spellSub].glyph} {spellSub}
          </span>
        )}
        {trapSub && (
          <span title={TRAP_SUBTYPE_META[trapSub].label} className="rounded-sm border border-pink-500/50 bg-pink-500/15 px-1.5 py-0.5 text-[10px] text-pink-300 backdrop-blur">
            {TRAP_SUBTYPE_META[trapSub].glyph} {trapSub}{TRAP_SUBTYPE_META[trapSub].speed === 3 && <span className="ml-1 text-[8px] text-crimson">SS3</span>}
          </span>
        )}
        {tier !== "None" && (
          <span title={tierMeta.label} className={cn("rounded-full bg-background/60 px-1.5 py-0.5 text-xs backdrop-blur border border-border/50", tierMeta.color)}>
            {tierMeta.glyph}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="font-display text-sm leading-tight text-foreground line-clamp-2">{card.name}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground line-clamp-1">
          {mtype ? `[${mtype}]` : card.type}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="text-gold">ATK {card.atk}</span>
          {card.def > 0 && <span className="text-silver">DEF {card.def}</span>}
        </div>
      </div>
    </>
  );

  const baseCls = cn(
    "group relative aspect-[3/4] w-full overflow-hidden rounded-md bg-card text-left block",
    `card-frame-${card.rarity}`,
    overlayCls,
    glowCls,
  );

  const animProps = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: Math.min(index * 0.03, 0.4), ease: "easeOut" as const },
    whileHover: { y: -6, scale: 1.02 },
  };

  if (asLink && !onClick) {
    return (
      <motion.div {...animProps} className={baseCls}>
        <Link to="/cards/$cardId" params={{ cardId: card.id }} className="absolute inset-0 block">
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4), ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={baseCls}
    >
      {inner}
    </motion.button>
  );
}