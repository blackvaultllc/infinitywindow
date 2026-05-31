import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  type Card,
  attributeOf, ATTRIBUTE_META,
  levelOf, monsterTypeOf,
  spellSubtypeOf, trapSubtypeOf, SPELL_SUBTYPE_META, TRAP_SUBTYPE_META,
  displayRarityOf, DISPLAY_RARITY_META,
} from "@/data/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailModal({ card, open, onOpenChange }: Props) {
  const attribute  = card ? attributeOf(card) : null;
  const attrMeta   = attribute ? ATTRIBUTE_META[attribute] : null;
  const level      = card ? levelOf(card) : 0;
  const mtype      = card ? monsterTypeOf(card) : null;
  const spellSub   = card ? spellSubtypeOf(card) : null;
  const trapSub    = card ? trapSubtypeOf(card) : null;
  const display    = card ? displayRarityOf(card) : null;
  const dispMeta   = display ? DISPLAY_RARITY_META[display] : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-gold/40 bg-card/95 p-0 backdrop-blur">
        <AnimatePresence mode="wait">
          {card && (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: -12 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid gap-6 md:grid-cols-[1fr_1.1fr]"
            >
              <div className={cn("relative aspect-[3/4] overflow-hidden rounded-l-lg", `card-frame-${card.rarity}`)}>
                <img src={card.art} alt={card.name} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
              <div className="flex flex-col gap-4 p-6 pr-8">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {dispMeta && (
                      <Badge variant="outline" className={cn("border-border/60 tracking-[0.18em]", dispMeta.color)}>
                        {dispMeta.label}
                      </Badge>
                    )}
                    {attrMeta && attribute && (
                      <Badge variant="outline" className={cn("border tracking-wider", attrMeta.tint, attrMeta.color)}>
                        {attrMeta.glyph} {attribute}
                      </Badge>
                    )}
                    {level > 0 && (
                      <Badge variant="outline" className="border-gold/60 text-gold">
                        Lv{level} {"★".repeat(Math.min(level, 6))}{level > 6 && `+${level-6}`}
                      </Badge>
                    )}
                    {mtype && <Badge variant="secondary">[{mtype}]</Badge>}
                    {spellSub && (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
                        {SPELL_SUBTYPE_META[spellSub].glyph} {SPELL_SUBTYPE_META[spellSub].label}
                      </Badge>
                    )}
                    {trapSub && (
                      <Badge variant="outline" className="border-pink-500/50 text-pink-300">
                        {TRAP_SUBTYPE_META[trapSub].glyph} {TRAP_SUBTYPE_META[trapSub].label}
                        {TRAP_SUBTYPE_META[trapSub].speed === 3 && <span className="ml-1 text-[10px] text-crimson">Spell Speed 3</span>}
                      </Badge>
                    )}
                    <Badge variant="secondary">{card.set}</Badge>
                  </div>
                  <DialogTitle className="font-display text-3xl text-gradient-gold">{card.name}</DialogTitle>
                  <DialogDescription className="sr-only">Card detail</DialogDescription>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-md border border-border/60 bg-background/40 p-3 text-center">
                  <Stat label="ATK"      value={card.atk} accent="text-gold" />
                  <Stat label="DEF"      value={card.def} accent="text-silver" />
                  <Stat label="DIVINITY" value={card.divinity} accent="text-accent" />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{card.lore}&rdquo;
                </p>

                {card.ability && (
                  <div className="rounded-md border border-accent/40 bg-accent/5 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-accent">Ability</span>
                      <span className="font-display text-sm text-gradient-gold">{card.ability.name}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.ability.description}</p>
                    {trapSub && (
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-pink-300/80">Must be Set face-down before activating.</p>
                    )}
                    {spellSub === "Ritual" && (
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-emerald-300/80">Sent to Graveyard after use.</p>
                    )}
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <div className="text-xs text-muted-foreground">
                    {card.owned ? <span className="text-foreground">In your vault</span> : "Not owned"}
                    <span className="mx-2 opacity-50">·</span>
                    Listing: <span className="text-gold">{card.price?.toLocaleString()} EXOD</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-border/70"
                      onClick={() => toast("Trade engine arrives in Phase 2.")}
                    >Trade</Button>
                    <Button
                      className="bg-gold text-gold-foreground hover:bg-gold/90"
                      onClick={() => toast(card.owned ? "Listing flow ships with the marketplace." : "Mint Studio opens in Phase 2.")}
                    >{card.owned ? "List for Sale" : "Mint to NFT"}</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("font-display text-2xl", accent)}>{value}</div>
    </div>
  );
}