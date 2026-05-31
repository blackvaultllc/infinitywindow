import raArt from "@/assets/card-ra.jpg";
import osirisArt from "@/assets/card-osiris.jpg";
import horusArt from "@/assets/card-horus.jpg";
import anubisArt from "@/assets/card-anubis.jpg";
import setArt from "@/assets/card-set.jpg";
import thothArt from "@/assets/card-thoth.jpg";
import bastetArt from "@/assets/card-bastet.jpg";
import sphinxArt from "@/assets/card-sphinx.jpg";
import sobekArt from "@/assets/card-sobek.jpg";
import ammitArt from "@/assets/card-ammit.jpg";
import scarabArt from "@/assets/card-scarab.jpg";
import mummyArt from "@/assets/card-mummy.jpg";
import serpentArt from "@/assets/card-serpent.jpg";
import jackalArt from "@/assets/card-jackal.jpg";
import priestArt from "@/assets/card-priest.jpg";
import exHeadArt from "@/assets/card-exodius-head.jpg";
import exRArmArt from "@/assets/card-exodius-rarm.jpg";
import exLArmArt from "@/assets/card-exodius-larm.jpg";
import exRLegArt from "@/assets/card-exodius-rleg.jpg";
import exLLegArt from "@/assets/card-exodius-lleg.jpg";
import eagleArt from "@/assets/card-eagle.jpg";
import nefariArt from "@/assets/card-nefari.jpg";
import colossusArt from "@/assets/card-colossus.jpg";
import shadowArt from "@/assets/card-shadow.jpg";
import heroEaglesPass from "@/assets/hero-eagles-pass.jpg";
import heroExodia from "@/assets/hero-exodius.jpg";
import psycronosArt from "@/assets/card-psycronos.jpg";
import khadijaArt from "@/assets/card-khadija.jpg";
// ── XOVIA Expansion Set "Generations" — 10 new arts ─────────────────────
import sekhmetArt from "@/assets/card-sekhmet.jpg";
import atumArt from "@/assets/card-atum.jpg";
import apophisArt from "@/assets/card-apophis.jpg";
import gebArt from "@/assets/card-geb.jpg";
import nutArt from "@/assets/card-nut.jpg";
import khnumArt from "@/assets/card-khnum.jpg";
import wepwawetArt from "@/assets/card-wepwawet.jpg";
import hekaArt from "@/assets/card-heka-priestess.jpg";
import boneHyenaArt from "@/assets/card-bone-hyena.jpg";
import desertCobraArt from "@/assets/card-desert-cobra.jpg";
// ── XOVIA "Legacy" expansion (24 generated cards) ──────────────────────
import sandSkirmisherArt from "@/assets/cards/generated/sand-skirmisher.jpg";
import bronzeAcolyteArt from "@/assets/cards/generated/bronze-acolyte.jpg";
import sunSpearmanArt from "@/assets/cards/generated/sun-spearman.jpg";
import reedSailorArt from "@/assets/cards/generated/reed-sailor.jpg";
import tombCleanerArt from "@/assets/cards/generated/tomb-cleaner.jpg";
import crocodileWhelpArt from "@/assets/cards/generated/crocodile-whelp.jpg";
import oryxRiderArt from "@/assets/cards/generated/oryx-rider.jpg";
import cobraCharmerArt from "@/assets/cards/generated/cobra-charmer.jpg";
import granaryGuardArt from "@/assets/cards/generated/granary-guard.jpg";
import linenInitiateArt from "@/assets/cards/generated/linen-initiate.jpg";
import starScribeArt from "@/assets/cards/generated/star-scribe.jpg";
import saltSmugglerArt from "@/assets/cards/generated/salt-smuggler.jpg";
import hatshepsutArt from "@/assets/cards/generated/hatshepsut.jpg";
import atenDiscipleArt from "@/assets/cards/generated/aten-disciple.jpg";
import nileHippoArt from "@/assets/cards/generated/nile-hippo.jpg";
import nekhbetVultureArt from "@/assets/cards/generated/nekhbet-vulture.jpg";
import sunboatCaptainArt from "@/assets/cards/generated/sunboat-captain.jpg";
import hermopolisIbisArt from "@/assets/cards/generated/hermopolis-ibis.jpg";
import bennuCrystalArt from "@/assets/cards/generated/bennu-crystal.jpg";
import heliopolisTriadArt from "@/assets/cards/generated/heliopolis-triad.jpg";
import horusEyeRebornArt from "@/assets/cards/generated/horus-eye-reborn.jpg";
import lapisPharaohArt from "@/assets/cards/generated/lapis-pharaoh.jpg";
import starSphinxArt from "@/assets/cards/generated/star-sphinx.jpg";
import ammonRaArt from "@/assets/cards/generated/ammon-ra.jpg";
import { ERA_100 } from "./era-cards";

export type Rarity = "Common" | "Rare" | "Divine" | "Legendary" | "Exodius";
export type CardType = "God" | "Spell" | "Trap" | "Relic" | "Beast" | "Warrior" | "Mage" | "Field" | "Seal";
export type AbilityKind =
  | "Pierce" | "DivineShield" | "DoubleStrike" | "Smite" | "Resurrect"
  | "Drain" | "Banish" | "Sandstorm" | "Eclipse" | "Judgment"
  | "FirstStrike" | "Counter" | "Burn" | "Bind" | "AssembleExodius"
  // Yu-Gi-Oh-flavored spell / trap mechanics (original names below):
  | "BoardWipe" | "MirrorForce" | "SpellNegate" | "MonsterSteal"
  | "Tribute" | "LifeBoost" | "Polymerize" | "Draw" | "ScarabSwarm";

export interface Ability {
  name: string;
  kind: AbilityKind;
  description: string;
  value?: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  atk: number;
  def: number;
  divinity: number;
  set: string;
  lore: string;
  art: string;
  ability?: Ability;
  variant?: string;
  owned?: boolean;
  price?: number; // EXOD
  ownerOnly?: boolean; // locked to the Pharaoh (owner) — non-tradeable, never in packs
}

// Glossary — every ability term gets a plain-language Egyptian-flavored definition.
// Used by the Codex page and tooltips inside card detail / arena.
export const ABILITY_GLOSSARY: Record<AbilityKind, { term: string; meaning: string }> = {
  Pierce:         { term: "Bone-Cleave",     meaning: "Damage that exceeds DEF spills directly into the duelist's vitality." },
  DivineShield:   { term: "Ankh Ward",       meaning: "Negates the first incoming strike or a set amount of damage." },
  DoubleStrike:   { term: "Twin Fang",       meaning: "The card attacks twice in the same battle phase at reduced power per hit." },
  Smite:          { term: "Solar Smite",     meaning: "Burst of holy damage on summon, ignoring shields." },
  Resurrect:      { term: "Eternal Return",  meaning: "When defeated, returns once at reduced strength for a final round." },
  Drain:          { term: "Heart-Drain",     meaning: "Heals the caster for a percentage of damage dealt." },
  Banish:         { term: "Devour",          meaning: "Removes a low-power opponent from play entirely." },
  Sandstorm:      { term: "Sandstorm",       meaning: "Field effect lowering all opposing ATK for the duel." },
  Eclipse:        { term: "Blood-Moon Eclipse", meaning: "Inverts ATK and DEF on the field for one round." },
  Judgment:       { term: "Hall of Two Truths", meaning: "Massive bonus damage to low-Divinity targets." },
  FirstStrike:    { term: "Falcon Strike",   meaning: "Always lands the opening blow before the opponent can act." },
  Counter:        { term: "Inkbound Counter", meaning: "Reflects a portion of incoming damage back at the attacker." },
  Burn:           { term: "Solar Burn",      meaning: "Unblockable fire damage that ignores DEF." },
  Bind:           { term: "Mind-Bind",       meaning: "Disables the opponent's ability for the rest of the duel." },
  AssembleExodius:{ term: "Assemble the Forbidden", meaning: "Mere presence of any Exodia relic seals the duel for its bearer." },
  BoardWipe:      { term: "Black Vortex",    meaning: "Destroys EVERY card on the field — both yours and the opponent's. Use when the gods favor risk." },
  MirrorForce:    { term: "Mirror of Aten",  meaning: "When the opponent declares an attack, reflects the full strike back onto their own lineup." },
  SpellNegate:    { term: "Voice of Thoth",  meaning: "Negates the next opponent Spell or Seal as if it had never been cast." },
  MonsterSteal:   { term: "Tomb Robbery",    meaning: "Takes control of one opposing card for the rest of the duel." },
  Tribute:        { term: "Tribute Rite",    meaning: "Sacrifice allied cards to summon a more powerful being or empower the field." },
  LifeBoost:      { term: "Breath of Khepri", meaning: "Restores vitality to your duelist directly, beyond what any card could heal." },
  Polymerize:     { term: "Forbidden Fusion", meaning: "Fuses two allied cards into a temporary combined warrior with summed ATK/DEF." },
  Draw:           { term: "Scroll of Anubis", meaning: "Draws additional cards from your deck into your hand." },
  ScarabSwarm:    { term: "Plague of Scarabs", meaning: "Summons a swarm of beetles that reduces every opposing card's ATK by 200." },
};

export const CARDS: Card[] = [
  // Exodia Prime (5) — relics
  { id: "ex-head", name: "Head of Exodia Prime", type: "Relic", rarity: "Exodius", atk: 0, def: 0, divinity: 100, set: "Genesis", lore: "The crowned mind of the Forbidden God. When all five relics are gathered, reality bends to the will of the bearer.", art: exHeadArt,
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "If your opponent fields any Exodia relic, the duel ends in your favor — the seal will not be broken." } },
  { id: "ex-rarm", name: "Right Arm of Exodia Prime", type: "Relic", rarity: "Exodius", atk: 0, def: 0, divinity: 100, set: "Genesis", lore: "The fist that broke the dawn. Lightning still crackles in its bandaged grip.", art: exRArmArt,
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "Pairs with any other Exodia relic to seal the duel." } },
  { id: "ex-larm", name: "Left Arm of Exodia Prime", type: "Relic", rarity: "Exodius", atk: 0, def: 0, divinity: 100, set: "Genesis", lore: "The open palm that holds the seed of creation — a lapis sun never meant to be touched.", art: exLArmArt,
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "Pairs with any other Exodia relic to seal the duel." } },
  { id: "ex-rleg", name: "Right Leg of Exodia Prime", type: "Relic", rarity: "Exodius", atk: 0, def: 0, divinity: 100, set: "Genesis", lore: "Planted at the foundation of the world. Where it stands, no army may pass.", art: exRLegArt,
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "Pairs with any other Exodia relic to seal the duel." } },
  { id: "ex-lleg", name: "Left Leg of Exodia Prime", type: "Relic", rarity: "Exodius", atk: 0, def: 0, divinity: 100, set: "Genesis", lore: "The stride of inevitability. Each step rewrites a dynasty.", art: exLLegArt,
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "Pairs with any other Exodia relic to seal the duel." } },

  // Legendary Gods (3)
  { id: "ra", name: "Ra Reborn", type: "God", rarity: "Legendary", atk: 4000, def: 3500, divinity: 95, set: "Solar Dynasty", lore: "The sun god risen from his own ashes, wreathed in solar fire that consumes all who deny the dawn.", art: raArt,
    ability: { name: "Solar Flare", kind: "Burn", description: "Deals 800 unstoppable burn damage on summon, bypassing DEF.", value: 800 } },
  { id: "osiris", name: "Osiris Eternal", type: "God", rarity: "Legendary", atk: 3800, def: 3200, divinity: 92, set: "Underworld", lore: "Sovereign of the green afterlife. To kneel before him is to be remembered forever.", art: osirisArt,
    ability: { name: "Eternal Return", kind: "Resurrect", description: "When defeated, returns once at 60% strength to fight a final round.", value: 60 } },
  { id: "horus", name: "Horus Ascendant", type: "God", rarity: "Legendary", atk: 3600, def: 3400, divinity: 90, set: "Solar Dynasty", lore: "The sky-falcon whose talons carry storms and whose eyes hold the sun and moon.", art: horusArt,
    ability: { name: "Talon of the Sky", kind: "FirstStrike", description: "Always strikes first, regardless of opponent's speed or trap.", } },

  // Divine (5)
  { id: "anubis", name: "Anubis, Judge of Souls", type: "God", rarity: "Divine", atk: 2900, def: 2700, divinity: 80, set: "Underworld", lore: "Weigher of hearts. Those found wanting feed the Devourer.", art: anubisArt,
    ability: { name: "Final Weighing", kind: "Judgment", description: "Opponents with Divinity below 40 take +1200 damage on the first strike.", value: 1200 } },
  { id: "set", name: "Set, Lord of Storms", type: "God", rarity: "Divine", atk: 3100, def: 2400, divinity: 78, set: "Desert War", lore: "Chaos walks the dunes wearing twin blades and a crown of horns.", art: setArt,
    ability: { name: "Sandstorm", kind: "Sandstorm", description: "Reduces opponent's ATK by 600 for the entire duel.", value: 600 } },
  { id: "thoth", name: "Thoth, Scribe of Eternity", type: "God", rarity: "Divine", atk: 2400, def: 3000, divinity: 88, set: "Hidden Library", lore: "Every spell ever cast was first written in his ledger.", art: thothArt,
    ability: { name: "Inkbound Counter", kind: "Counter", description: "Reflects 40% of incoming damage back at the attacker.", value: 40 } },
  { id: "bastet", name: "Bastet, Twin Daggers", type: "God", rarity: "Divine", atk: 2700, def: 2600, divinity: 76, set: "Moonlit Temple", lore: "Patron of warriors and stalking shadows. She strikes before her purr is heard.", art: bastetArt,
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice each round at 65% ATK per strike.", value: 65 } },
  { id: "nefari", name: "Nefari, Pharaoh of Whispers", type: "Mage", rarity: "Divine", atk: 2600, def: 2800, divinity: 85, set: "Hidden Library", lore: "She rules with neither sword nor decree — only suggestion. Armies forget why they marched.", art: nefariArt,
    ability: { name: "Mind Bind", kind: "Bind", description: "Cancels the opponent's ability for the entire duel.", } },

  // Rare (5)
  { id: "sphinx", name: "Sphinx Guardian", type: "God", rarity: "Rare", atk: 2200, def: 2800, divinity: 60, set: "Gates of Giza", lore: "Speaks only in riddles. Answer wrong and the desert keeps you.", art: sphinxArt,
    ability: { name: "Riddle Wall", kind: "DivineShield", description: "Negates the first strike taken in the duel.", } },
  { id: "sobek", name: "Sobek, Crocodile King", type: "God", rarity: "Rare", atk: 2400, def: 2000, divinity: 58, set: "Nile Court", lore: "The river bows to no one but the king with the jagged smile.", art: sobekArt,
    ability: { name: "Death Roll", kind: "Drain", description: "Heals for 35% of damage dealt each strike.", value: 35 } },
  { id: "ammit", name: "Ammit, Devourer of Hearts", type: "Trap", rarity: "Rare", atk: 2300, def: 1800, divinity: 55, set: "Underworld", lore: "Triggered when judgment is passed. The unworthy are unmade.", art: ammitArt,
    ability: { name: "Devour", kind: "Banish", description: "Instantly defeats opponents with ATK below 1500.", value: 1500 } },
  { id: "scarab", name: "Scarab Champion", type: "Beast", rarity: "Rare", atk: 2100, def: 2300, divinity: 50, set: "Desert War", lore: "Forged in the carapace of a sacred beetle. Each strike sings of rebirth.", art: scarabArt,
    ability: { name: "Carapace", kind: "DivineShield", description: "Negates the first 600 damage taken.", value: 600 } },
  { id: "eagle", name: "Suten, Eagle of the Pass", type: "Warrior", rarity: "Rare", atk: 2500, def: 2100, divinity: 62, set: "Eagle's Pass", lore: "Sentinel of the sacred causeway. He sees a traveler's intent before they cross the first stone.", art: eagleArt,
    ability: { name: "Stoop Dive", kind: "FirstStrike", description: "Strikes first on the opening round, dealing +300 ATK.", value: 300 } },

  // Common (5)
  { id: "mummy", name: "Mummy Sentinel", type: "God", rarity: "Common", atk: 1200, def: 1800, divinity: 25, set: "Tomb Watch", lore: "Risen to guard a name that was never spoken.", art: mummyArt,
    ability: { name: "Linen Wrap", kind: "DivineShield", description: "Negates the first 300 damage taken.", value: 300 } },
  { id: "serpent", name: "Serpent of the Nile", type: "Beast", rarity: "Common", atk: 1500, def: 900, divinity: 22, set: "Nile Court", lore: "A flash of gold scales is the last thing the careless ever see.", art: serpentArt,
    ability: { name: "Venom Bite", kind: "Burn", description: "Deals 200 burn damage that ignores DEF on the first strike.", value: 200 } },
  { id: "jackal", name: "Jackal Scout", type: "Beast", rarity: "Common", atk: 1100, def: 1100, divinity: 20, set: "Desert War", lore: "Eyes that see through dust storms and lies alike.", art: jackalArt,
    ability: { name: "Pack Hunt", kind: "DoubleStrike", description: "Attacks twice at 55% ATK per strike.", value: 55 } },
  { id: "priest", name: "Priest of Karnak", type: "Spell", rarity: "Common", atk: 800, def: 1400, divinity: 35, set: "Hidden Library", lore: "Channels temple flame to mend any wound — or open any door.", art: priestArt,
    ability: { name: "Karnak Mend", kind: "Drain", description: "Heals for 25% of damage dealt.", value: 25 } },
  { id: "shadow", name: "Khepri Shade", type: "Warrior", rarity: "Common", atk: 1400, def: 1000, divinity: 28, set: "Moonlit Temple", lore: "Walks the blood-moon rooftops. The Pharaoh never sees the dagger; only the silence after.", art: shadowArt,
    ability: { name: "Backstrike", kind: "Pierce", description: "Damage overflow past DEF deals 50% of the excess directly to vitality.", value: 50 } },

  // Extra heroes from new arts
  { id: "colossus", name: "Sandstone Colossus", type: "Warrior", rarity: "Divine", atk: 2800, def: 3300, divinity: 70, set: "Desert War", lore: "Carved from the cliffs of the Eagle's Pass and bound with molten gold. It does not tire.", art: colossusArt,
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reflects 25% of incoming damage and reduces all damage taken by 200.", value: 25 } },

  // ── Field Cards (Egyptian terrain) ───────────────────────────────────────
  { id: "field-sandscape", name: "Endless Sandscape", type: "Field", rarity: "Rare", atk: 0, def: 0, divinity: 40, set: "Desert War",
    lore: "Dunes stretch to the horizon. Cavalry stumbles, archers go blind, gods feel at home.", art: heroEaglesPass,
    ability: { name: "Sandstorm", kind: "Sandstorm", description: "All opposing non-Divine cards lose 400 ATK while this field stands.", value: 400 } },
  { id: "field-blood-moon", name: "Blood-Moon Eclipse", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 60, set: "Moonlit Temple",
    lore: "When Ra's eye is veiled in crimson, even the dead can strike.", art: shadowArt,
    ability: { name: "Eclipse", kind: "Eclipse", description: "Swaps ATK and DEF of every card on the field for one round.", } },
  { id: "field-hall-two-truths", name: "Hall of Two Truths", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 70, set: "Underworld",
    lore: "Anubis weighs every heart laid upon this floor. The unworthy never leave.", art: anubisArt,
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Cards with Divinity below 50 take +500 damage each round.", value: 500 } },
  { id: "field-nile-flood", name: "Flooding of the Nile", type: "Field", rarity: "Rare", atk: 0, def: 0, divinity: 35, set: "Nile Court",
    lore: "The river rises and so does the divine debt owed to its serpent king.", art: sobekArt,
    ability: { name: "Heart-Drain", kind: "Drain", description: "Beast-type cards heal 20% of damage dealt while this field stands.", value: 20 } },

  // ── Seal Cards (Egyptian re-name of Traps) ──────────────────────────────
  { id: "seal-mirror", name: "Mirror of the Pharaoh", type: "Seal", rarity: "Divine", atk: 0, def: 2000, divinity: 55, set: "Hidden Library",
    lore: "A polished bronze disc engraved with the Eye. Strikes reflect back upon the striker.", art: thothArt,
    ability: { name: "Inkbound Counter", kind: "Counter", description: "Reflects 60% of the next incoming attack back at the attacker.", value: 60 } },
  { id: "seal-ankh-ward", name: "Ankh of the Living", type: "Seal", rarity: "Rare", atk: 0, def: 1600, divinity: 45, set: "Tomb Watch",
    lore: "A ward etched in moonstone. Death must wait its turn.", art: mummyArt,
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the next 900 damage taken by any allied card.", value: 900 } },
  { id: "seal-locust", name: "Plague of Locusts", type: "Seal", rarity: "Rare", atk: 0, def: 800, divinity: 30, set: "Desert War",
    lore: "A storm of wings darkens the sun and devours the foe's strength.", art: scarabArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 600 unblockable burn damage to the opposing field card.", value: 600 } },
  { id: "seal-binding", name: "Binding of Osiris", type: "Seal", rarity: "Divine", atk: 0, def: 1400, divinity: 65, set: "Underworld",
    lore: "Linen wraps tighten around the heart of any who dare strike the dead.", art: osirisArt,
    ability: { name: "Mind-Bind", kind: "Bind", description: "Disables the opponent's ability for the remainder of the duel.", } },

  // ── Additional God / Warrior / Mage cards ───────────────────────────────
  { id: "ptah", name: "Ptah, Architect of Worlds", type: "God", rarity: "Legendary", atk: 3500, def: 3700, divinity: 93, set: "Genesis",
    lore: "He spoke the universe into being and can speak any wall into existence between you and harm.", art: heroExodia,
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reflects 35% of all incoming damage and reduces it by 400.", value: 35 } },
  { id: "isis", name: "Isis, Mother of Magic", type: "Mage", rarity: "Divine", atk: 2700, def: 2900, divinity: 90, set: "Hidden Library",
    lore: "Healer, weaver, sister-wife to Osiris. Her tears mend any wound — even those of the dead.", art: nefariArt,
    ability: { name: "Eternal Return", kind: "Resurrect", description: "When defeated, returns once at 70% strength.", value: 70 } },
  { id: "khonsu", name: "Khonsu, the Wandering Moon", type: "Mage", rarity: "Divine", atk: 2500, def: 2700, divinity: 82, set: "Moonlit Temple",
    lore: "He charts the night sky. Time itself stutters when he draws his silver bow.", art: thothArt,
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Strikes first and deals +500 ATK on the opening hit.", value: 500 } },
  { id: "wadjet", name: "Wadjet, Cobra of the Crown", type: "Beast", rarity: "Rare", atk: 2300, def: 1700, divinity: 60, set: "Nile Court",
    lore: "She guards the pharaoh from the gold band of his brow. Strike the king, and her fangs find you first.", art: serpentArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 400 venom burn damage that ignores DEF.", value: 400 } },
  { id: "khepri", name: "Khepri, Scarab of Dawn", type: "Beast", rarity: "Divine", atk: 2600, def: 2400, divinity: 75, set: "Solar Dynasty",
    lore: "He rolls the sun across the sky each morning. Trample him and you snuff the dawn.", art: scarabArt,
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice at 70% ATK per strike.", value: 70 } },
  { id: "neith", name: "Neith, Weaver of Fate", type: "Mage", rarity: "Divine", atk: 2400, def: 3000, divinity: 84, set: "Hidden Library",
    lore: "She wove the world on her loom and can unstitch any blow that lands on her people.", art: bastetArt,
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the first 1100 damage taken in the duel.", value: 1100 } },
  { id: "ma-at", name: "Ma'at, Feather of Truth", type: "Spell", rarity: "Rare", atk: 1200, def: 1600, divinity: 70, set: "Hidden Library",
    lore: "A single white feather. Light enough to balance the heart, heavy enough to damn a tyrant.", art: priestArt,
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Opponents under 50 Divinity take +800 damage.", value: 800 } },
  { id: "khaba", name: "Khaba, Sand Rider", type: "Warrior", rarity: "Common", atk: 1400, def: 1200, divinity: 24, set: "Desert War",
    lore: "A mercenary of the western dunes. Sells his blade for water, not gold.", art: jackalArt,
    ability: { name: "Bone-Cleave", kind: "Pierce", description: "Excess damage past DEF deals 40% to vitality.", value: 40 } },
  { id: "tahu", name: "Tahu, Tomb Guardian", type: "Warrior", rarity: "Common", atk: 1300, def: 1700, divinity: 26, set: "Tomb Watch",
    lore: "Sworn to one door, one name, one silence. He has not slept in three thousand years.", art: mummyArt,
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the first 400 damage taken.", value: 400 } },
  { id: "kemet-priest", name: "Priestess of Kemet", type: "Spell", rarity: "Common", atk: 900, def: 1300, divinity: 38, set: "Hidden Library",
    lore: "She mixes oils and chants by candle. Her smoke confuses both arrow and enemy.", art: priestArt,
    ability: { name: "Heart-Drain", kind: "Drain", description: "Heals 30% of damage dealt to undead foes.", value: 30 } },
  { id: "ammit-2", name: "Ammit, Shadow Twin", type: "Beast", rarity: "Rare", atk: 2200, def: 1900, divinity: 52, set: "Underworld",
    variant: "Twin",
    lore: "Where one Devourer feeds, another waits in the wings. They are never seen together — yet they are never apart.", art: ammitArt,
    ability: { name: "Devour", kind: "Banish", description: "Instantly defeats opponents with ATK below 1700.", value: 1700 } },
  { id: "ra-variant", name: "Ra, Burning Disc", type: "God", rarity: "Legendary", atk: 4000, def: 3500, divinity: 95, set: "Solar Dynasty",
    variant: "Eclipse Edition",
    lore: "Same god. Same fire. But this aspect of Ra burns ALL on the field — friend and foe alike if not warded.", art: raArt,
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 1000 burn damage to every opposing card on summon.", value: 1000 } },

  // ── OWNER-ONLY SIGNATURE CARDS ──────────────────────────────────────────
  // Hierarchy: Exodia (5 assembled) > Psycronos > Khadija > everything else.
  // These cannot be pulled from packs, listed on the marketplace by non-owners,
  // or traded out of the Pharaoh's vault unless the owner explicitly trades them.
  { id: "psycronos", name: "Psycronos, Lord of Time & Forbidden Traps", type: "God", rarity: "Exodius",
    atk: 4800, def: 4500, divinity: 99, set: "Pharaoh's Seal",
    lore: "Forged in the hour before the first sunrise. Psycronos walks between heartbeats — every trap, every counter, every reversal already cast before the duel began. Only the Pharaoh wields him.",
    art: psycronosArt, ownerOnly: true,
    ability: { name: "Chrono-Bind", kind: "Bind", description: "Negates ALL opponent abilities and traps for the entire duel. Strikes first every round at +500 ATK. Cannot be banished, drained, or countered.", value: 500 } },
  { id: "khadija", name: "Khadija, Princess of the Dawn", type: "God", rarity: "Legendary",
    atk: 4200, def: 4000, divinity: 97, set: "Pharaoh's Seal",
    lore: "Daughter of the Pharaoh, sworn shield of the dynasty. Her dawn cannot be dimmed by any god save her father's hand and the Forbidden Five.",
    art: khadijaArt, ownerOnly: true,
    ability: { name: "Dawn's Aegis", kind: "DivineShield", description: "Negates the first 2000 damage. Reflects 50% of melee damage. Outclassed only by an assembled Exodia set or Psycronos.", value: 2000 } },

  // ════════════════════════════════════════════════════════════════════
  // XOVIA GENERATIONS EXPANSION (20 new cards, all freshly arted or curated)
  // ════════════════════════════════════════════════════════════════════

  // ── Legendary (1) ────────────────────────────────────────────────────
  { id: "atum-pharaoh", name: "Atum, the First Pharaoh", type: "God", rarity: "Legendary",
    atk: 3700, def: 3900, divinity: 96, set: "Generations",
    lore: "Before the gods named themselves, Atum stood alone upon the primeval mound and spoke creation into being. His staff parts the cosmic waters; his ankh measures eternity.",
    art: atumArt,
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 1100 holy damage to all opposing cards on summon.", value: 1100 } },

  // ── Divine (4) ───────────────────────────────────────────────────────
  { id: "sekhmet-lioness", name: "Sekhmet, Lioness of War", type: "God", rarity: "Divine",
    atk: 3000, def: 2500, divinity: 84, set: "Generations",
    lore: "Her roar shatters bronze. Her thirst is never slaked. The dunes she crosses turn to glass.",
    art: sekhmetArt,
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice at 75% ATK per strike.", value: 75 } },
  { id: "geb-earthking", name: "Geb, Earth-King", type: "God", rarity: "Divine",
    atk: 2400, def: 3400, divinity: 82, set: "Generations",
    lore: "Crowned in barley, bearded with reeds. When he sighs, the cliffs of Eagle's Pass settle further into the desert.",
    art: gebArt,
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reduces all damage taken by 400 and reflects 25%.", value: 25 } },
  { id: "nut-skymother", name: "Nut, Sky Mother", type: "Mage", rarity: "Divine",
    atk: 2500, def: 3200, divinity: 86, set: "Generations",
    lore: "Her body arches over the world. Each star upon her skin is a heart she has swallowed and refused to release.",
    art: nutArt,
    ability: { name: "Eternal Return", kind: "Resurrect", description: "When defeated, returns once at 80% strength.", value: 80 } },
  { id: "shu-breath", name: "Shu, Breath of Heaven", type: "Mage", rarity: "Divine",
    atk: 2600, def: 2800, divinity: 80, set: "Generations",
    lore: "He holds Nut aloft so she does not crush Geb. Without him, sky and earth would collapse into one another.",
    art: nefariArt,
    ability: { name: "Voice of Thoth", kind: "SpellNegate", description: "Negates the next opposing Spell or Seal as if it were never cast.", } },

  // ── Rare (7) ─────────────────────────────────────────────────────────
  { id: "apophis-chaos", name: "Apophis, Chaos Serpent", type: "Beast", rarity: "Rare",
    atk: 2600, def: 1800, divinity: 58, set: "Generations",
    lore: "Each night he tries to swallow the sun barge. Each dawn he fails. Each loss only feeds his coils.",
    art: apophisArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 500 unblockable shadow burn that ignores DEF.", value: 500 } },
  { id: "khnum-potter", name: "Khnum, Potter of Souls", type: "God", rarity: "Rare",
    atk: 2200, def: 2400, divinity: 64, set: "Generations",
    lore: "He shapes each new soul on his wheel by the Nile. Strike him, and a thousand unborn lives shatter at once.",
    art: khnumArt,
    ability: { name: "Eternal Return", kind: "Resurrect", description: "When an allied Common card is defeated, it returns once at 50% strength.", value: 50 } },
  { id: "wepwawet-pathfinder", name: "Wepwawet, Opener of Ways", type: "Warrior", rarity: "Rare",
    atk: 2500, def: 2000, divinity: 60, set: "Generations",
    lore: "The grey wolf scout who walks ahead of every Pharaoh's army. Where he plants a standard, an empire follows.",
    art: wepwawetArt,
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Strikes first and gains +200 ATK on the opening round.", value: 200 } },
  { id: "heka-priestess", name: "Heka, Priestess of the Word", type: "Mage", rarity: "Rare",
    atk: 2000, def: 2200, divinity: 66, set: "Generations",
    lore: "She does not cast spells — she remembers the names by which the world was first ordered, and the world obeys.",
    art: hekaArt,
    ability: { name: "Mind-Bind", kind: "Bind", description: "Disables the opponent's ability for the duel.", } },
  { id: "maat-feather", name: "Ma'at, Feather of Judgment", type: "Spell", rarity: "Rare",
    atk: 1400, def: 1700, divinity: 65, set: "Generations",
    lore: "Lay your heart upon the scale. If it weighs more than a feather, you are unmade.",
    art: thothArt,
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Opponents with Divinity below 50 take +700 damage.", value: 700 } },
  { id: "mafdet-justice", name: "Mafdet, Cat of Justice", type: "Beast", rarity: "Rare",
    atk: 2300, def: 1900, divinity: 56, set: "Generations",
    lore: "Beheader of serpents. Sworn cat of the royal bedchamber. Her claws know only the guilty.",
    art: bastetArt,
    ability: { name: "Bone-Cleave", kind: "Pierce", description: "Excess damage past DEF deals 50% to vitality.", value: 50 } },
  { id: "ankh-sentinel", name: "Ankh-Bound Sentinel", type: "Warrior", rarity: "Rare",
    atk: 2100, def: 2500, divinity: 54, set: "Generations",
    lore: "An iron giant fused to an ankh-rune that beats like a second heart. Cuts heal. Bones knit.",
    art: colossusArt,
    ability: { name: "Heart-Drain", kind: "Drain", description: "Heals for 30% of damage dealt.", value: 30 } },

  // ── Common (8) ───────────────────────────────────────────────────────
  { id: "desert-cobra", name: "Desert Cobra", type: "Beast", rarity: "Common",
    atk: 1300, def: 800, divinity: 18, set: "Generations",
    lore: "Coiled on the sun-baked stone, it waits for footsteps. It does not need to wait long.",
    art: desertCobraArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 250 venom burn on the first strike.", value: 250 } },
  { id: "bone-hyena", name: "Bone Hyena", type: "Beast", rarity: "Common",
    atk: 1400, def: 1000, divinity: 20, set: "Generations",
    lore: "It prowls the necropolis pulling threads from forgotten linen. Its laugh is the last thing tomb-robbers hear.",
    art: boneHyenaArt,
    ability: { name: "Pack Hunt", kind: "DoubleStrike", description: "Attacks twice at 55% ATK per strike.", value: 55 } },
  { id: "tomb-beetle", name: "Tomb Beetle", type: "Beast", rarity: "Common",
    atk: 900, def: 1500, divinity: 22, set: "Generations",
    lore: "Sacred to Khepri. Its carapace turns the lesser blade aside; its bite ends sleep.",
    art: scarabArt,
    ability: { name: "Carapace", kind: "DivineShield", description: "Negates the first 350 damage taken.", value: 350 } },
  { id: "sand-acolyte", name: "Sand Acolyte", type: "Mage", rarity: "Common",
    atk: 800, def: 1200, divinity: 30, set: "Generations",
    lore: "Initiate of the open desert. He sings prayers into the wind and is sometimes answered.",
    art: priestArt,
    ability: { name: "Karnak Mend", kind: "Drain", description: "Heals 20% of damage dealt.", value: 20 } },
  { id: "nile-fisher", name: "Nile Fisherman", type: "Warrior", rarity: "Common",
    atk: 1200, def: 1100, divinity: 16, set: "Generations",
    lore: "His spear is forged for crocodiles, not men. He prefers it that way.",
    art: sobekArt,
    ability: { name: "Bone-Cleave", kind: "Pierce", description: "Excess damage past DEF deals 35% to vitality.", value: 35 } },
  { id: "reed-spear", name: "Reed-Spear Skirmisher", type: "Warrior", rarity: "Common",
    atk: 1500, def: 800, divinity: 14, set: "Generations",
    lore: "Light, fast, and unbearably cheap to replace. The Pharaoh sends them first.",
    art: jackalArt,
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Always lands the opening blow.", } },
  { id: "sun-disc", name: "Sun-Disc Scroll", type: "Spell", rarity: "Common",
    atk: 0, def: 600, divinity: 26, set: "Generations",
    lore: "A papyrus inked at high noon. Catches sunlight in a single line and releases it as fire.",
    art: raArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 400 fire damage to one opposing card.", value: 400 } },
  { id: "linen-wrap", name: "Linen Wrap Seal", type: "Seal", rarity: "Common",
    atk: 0, def: 900, divinity: 18, set: "Generations",
    lore: "Bandages soaked in temple oil. They remember the shape of a wound and undo it.",
    art: mummyArt,
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the next 500 damage taken by an allied card.", value: 500 } },
];

// ── XOVIA "Legacy" expansion: 24 freshly-arted cards ────────────────────
// Stats spread across rarities; every entry references its own dedicated art.
const LEGACY_24: Card[] = [
  // Commons (12)
  { id: "leg-sand-skirmisher", name: "Sand-Skirmisher of Akhet", type: "Warrior", rarity: "Common", atk: 1300, def: 1000, divinity: 18, set: "Legacy", lore: "First over the dune, last to retreat. His sandals know every wadi between the Pharaoh's outposts.", art: sandSkirmisherArt,
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Always lands the opening blow.", } },
  { id: "leg-bronze-acolyte", name: "Bronze Acolyte", type: "Mage", rarity: "Common", atk: 900, def: 1200, divinity: 28, set: "Legacy", lore: "An initiate scarred by foundry fire. He hums prayers to keep the smelt pure.", art: bronzeAcolyteArt,
    ability: { name: "Karnak Mend", kind: "Drain", description: "Heals 22% of damage dealt.", value: 22 } },
  { id: "leg-sun-spearman", name: "Sun-Spearman of Heliopolis", type: "Warrior", rarity: "Common", atk: 1500, def: 900, divinity: 22, set: "Legacy", lore: "His spear is sighted at noon. He never misses the second flash.", art: sunSpearmanArt,
    ability: { name: "Bone-Cleave", kind: "Pierce", description: "Overflow past DEF deals 40% to vitality.", value: 40 } },
  { id: "leg-reed-sailor", name: "Reed Sailor of the Delta", type: "Warrior", rarity: "Common", atk: 1100, def: 1300, divinity: 16, set: "Legacy", lore: "He ties knots even Sobek cannot bite through.", art: reedSailorArt,
    ability: { name: "Linen Wrap", kind: "DivineShield", description: "Negates the first 300 damage taken.", value: 300 } },
  { id: "leg-tomb-cleaner", name: "Tomb-Cleaner of Saqqara", type: "Warrior", rarity: "Common", atk: 1000, def: 1400, divinity: 24, set: "Legacy", lore: "He sweeps the dust of forgotten kings, and listens for the voices beneath the floor.", art: tombCleanerArt,
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the first 450 damage taken.", value: 450 } },
  { id: "leg-crocodile-whelp", name: "Crocodile Whelp", type: "Beast", rarity: "Common", atk: 1200, def: 900, divinity: 14, set: "Legacy", lore: "Knee-high and already smiling. The river feeds him scraps; the Pharaoh feeds him names.", art: crocodileWhelpArt,
    ability: { name: "Venom Bite", kind: "Burn", description: "Deals 220 venom burn that ignores DEF.", value: 220 } },
  { id: "leg-oryx-rider", name: "Oryx Rider of the West", type: "Warrior", rarity: "Common", atk: 1450, def: 1050, divinity: 20, set: "Legacy", lore: "His mount's horns part the dunes like a prow.", art: oryxRiderArt,
    ability: { name: "Pack Hunt", kind: "DoubleStrike", description: "Attacks twice at 55% ATK per strike.", value: 55 } },
  { id: "leg-cobra-charmer", name: "Cobra Charmer", type: "Mage", rarity: "Common", atk: 850, def: 1250, divinity: 32, set: "Legacy", lore: "He whistles a note older than dynasties. The serpents listen, then obey.", art: cobraCharmerArt,
    ability: { name: "Mind-Bind", kind: "Bind", description: "Silences the next opposing Common card's ability.", } },
  { id: "leg-granary-guard", name: "Granary Guard of Memphis", type: "Warrior", rarity: "Common", atk: 1250, def: 1500, divinity: 21, set: "Legacy", lore: "Stand between him and the seed and you will be ash before harvest.", art: granaryGuardArt,
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reduces all incoming damage by 150 this duel.", value: 15 } },
  { id: "leg-linen-initiate", name: "Linen Initiate", type: "Mage", rarity: "Common", atk: 800, def: 1300, divinity: 30, set: "Legacy", lore: "His robes are washed in salt water. His prayers are washed in his own breath.", art: linenInitiateArt,
    ability: { name: "Heart-Drain", kind: "Drain", description: "Heals 25% of damage dealt.", value: 25 } },
  { id: "leg-star-scribe", name: "Star-Scribe of Thebes", type: "Mage", rarity: "Common", atk: 750, def: 1450, divinity: 36, set: "Legacy", lore: "He maps the night sky onto papyrus and the papyrus onto the next dynasty.", art: starScribeArt,
    ability: { name: "Scroll of Anubis", kind: "Draw", description: "Draw 1 additional card.", value: 1 } },
  { id: "leg-salt-smuggler", name: "Salt Smuggler of the Red Sea", type: "Warrior", rarity: "Common", atk: 1350, def: 1000, divinity: 17, set: "Legacy", lore: "His blade is bartered for, not earned. He still uses it better than most kings.", art: saltSmugglerArt,
    ability: { name: "Backstrike", kind: "Pierce", description: "Overflow past DEF deals 35% to vitality.", value: 35 } },

  // Rares (7)
  { id: "leg-hatshepsut", name: "Hatshepsut, Falcon-Queen", type: "Warrior", rarity: "Rare", atk: 2400, def: 2200, divinity: 65, set: "Legacy", lore: "She wore the false beard and the true crown. The desert remembered her name longer than her successors tried to erase it.", art: hatshepsutArt,
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Strikes first with +400 ATK.", value: 400 } },
  { id: "leg-aten-disciple", name: "Aten Disciple", type: "Mage", rarity: "Rare", atk: 2000, def: 2300, divinity: 62, set: "Legacy", lore: "He worships only the disc. The other gods, he says, are merely reflections.", art: atenDiscipleArt,
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 500 holy damage on summon.", value: 500 } },
  { id: "leg-nile-hippo", name: "Nile Hippopotamus", type: "Beast", rarity: "Rare", atk: 2300, def: 2100, divinity: 50, set: "Legacy", lore: "Sleeps in the reeds. Wakes for trespass. Taweret blesses every bite.", art: nileHippoArt,
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reflects 30% of incoming damage.", value: 30 } },
  { id: "leg-nekhbet-vulture", name: "Nekhbet's Vulture", type: "Beast", rarity: "Rare", atk: 2500, def: 1700, divinity: 58, set: "Legacy", lore: "She circles the battlefield before the battle begins. Her shadow already knows who falls.", art: nekhbetVultureArt,
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice at 65% ATK per strike.", value: 65 } },
  { id: "leg-sunboat-captain", name: "Captain of the Sun-Boat", type: "Warrior", rarity: "Rare", atk: 2200, def: 2000, divinity: 60, set: "Legacy", lore: "Each night he rows Ra through the underworld. He has never looked back.", art: sunboatCaptainArt,
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 450 burn damage that ignores DEF.", value: 450 } },
  { id: "leg-hermopolis-ibis", name: "Ibis of Hermopolis", type: "Mage", rarity: "Rare", atk: 1900, def: 2400, divinity: 64, set: "Legacy", lore: "Sacred to Thoth. Its beak inks the next word the world will read.", art: hermopolisIbisArt,
    ability: { name: "Voice of Thoth", kind: "SpellNegate", description: "Negates the next opposing Common or Rare Spell.", } },
  { id: "leg-bennu-crystal", name: "Bennu Crystal", type: "Relic", rarity: "Rare", atk: 1600, def: 2200, divinity: 70, set: "Legacy", lore: "A teardrop of the phoenix. Heat it once, and it burns until the world ends.", art: bennuCrystalArt,
    ability: { name: "Eternal Return", kind: "Resurrect", description: "Allied Common card returns once at 50% strength.", value: 50 } },

  // Divines (3)
  { id: "leg-heliopolis-triad", name: "Heliopolis Triad", type: "God", rarity: "Divine", atk: 2800, def: 2900, divinity: 84, set: "Legacy", lore: "Atum, Shu, and Tefnut speak as one mouth. The horizon kneels.", art: heliopolisTriadArt,
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 900 holy damage to all opposing cards on summon.", value: 900 } },
  { id: "leg-horus-eye-reborn", name: "Eye of Horus Reborn", type: "Relic", rarity: "Divine", atk: 0, def: 2400, divinity: 86, set: "Legacy", lore: "Shattered, found, fitted back. It sees clearer for having been broken.", art: horusEyeRebornArt,
    ability: { name: "Inkbound Counter", kind: "Counter", description: "Reflects 50% of the next incoming strike.", value: 50 } },
  { id: "leg-lapis-pharaoh", name: "Lapis Pharaoh", type: "God", rarity: "Divine", atk: 2900, def: 2700, divinity: 82, set: "Legacy", lore: "Carved of pure lapis lazuli and crowned at midnight. His decrees are written in starlight.", art: lapisPharaohArt,
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Opponents under 55 Divinity take +900 damage.", value: 900 } },

  // Legendaries (2)
  { id: "leg-star-sphinx", name: "Star Sphinx of the Constellations", type: "God", rarity: "Legendary", atk: 3600, def: 3700, divinity: 92, set: "Legacy", lore: "She poses riddles whose answers rearrange the night sky. Speak wrongly and a constellation forgets you.", art: starSphinxArt,
    ability: { name: "Mind-Bind", kind: "Bind", description: "Disables every opposing ability for the entire duel.", } },
  { id: "leg-ammon-ra", name: "Ammon-Ra, Hidden Flame", type: "God", rarity: "Legendary", atk: 4000, def: 3400, divinity: 95, set: "Legacy", lore: "The face of Ra worshipped only in caverns. When his name is spoken aloud, even priests look away.", art: ammonRaArt,
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 1300 holy damage on summon, ignoring shields.", value: 1300 } },
];

CARDS.push(...LEGACY_24);
CARDS.push(...ERA_100);

// ── EXPANSION PACK: +85 cards ───────────────────────────────────────────
// Rotates existing artwork (28 distinct paintings) across additional cards
// so the vault breaks past 100 with varied stats, types, and abilities.
const ART_POOL = [
  raArt, osirisArt, horusArt, anubisArt, setArt, thothArt, bastetArt,
  sphinxArt, sobekArt, ammitArt, scarabArt, mummyArt, serpentArt,
  jackalArt, priestArt, eagleArt, nefariArt, colossusArt, shadowArt,
  heroEaglesPass, heroExodia,
];

type Gen = Omit<Card, "art" | "price" | "owned"> & { art?: string };

const EXPANSION: Gen[] = [
  // ── 4 NEW OWNER-ONLY EXODIA-TIER SIGNATURE CARDS (Pharaoh's vault only) ─
  { id: "owner-aionis", name: "Aionis, Chronicler of the Pharaoh", type: "Mage", rarity: "Exodius",
    atk: 4700, def: 4600, divinity: 99, set: "Pharaoh's Seal", ownerOnly: true,
    lore: "Aionis records every duel before it is fought. Pages turn faster than blades.",
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Inflicts +2000 damage to any card with Divinity under 80. Cannot be silenced.", value: 2000 } },
  { id: "owner-nyxara", name: "Nyxara, Queen of Forbidden Stars", type: "God", rarity: "Exodius",
    atk: 4750, def: 4400, divinity: 99, set: "Pharaoh's Seal", ownerOnly: true,
    lore: "Her crown is a constellation no astronomer is permitted to name.",
    ability: { name: "Blood-Moon Eclipse", kind: "Eclipse", description: "Inverts ATK and DEF on every opposing card for the entire duel.", } },
  { id: "owner-domenick", name: "Domenick, Pharaoh Eternal", type: "God", rarity: "Exodius",
    atk: 5000, def: 4800, divinity: 100, set: "Pharaoh's Seal", ownerOnly: true,
    lore: "The Pharaoh's own hand. While he stands, no Exodia relic answers another's call.",
    ability: { name: "Assemble the Forbidden", kind: "AssembleExodius", description: "Counts as all five Exodia relics simultaneously. Seals the duel on summon if unopposed by a full opposing Exodia set.", } },
  { id: "owner-thanaket", name: "Thanaket, Reaper of Lesser Gods", type: "God", rarity: "Exodius",
    atk: 4900, def: 4200, divinity: 99, set: "Pharaoh's Seal", ownerOnly: true,
    lore: "He collects the names of gods who failed the Pharaoh. The list is long.",
    ability: { name: "Devour", kind: "Banish", description: "Banishes any opposing card with ATK below 3500 on summon.", value: 3500 } },

  // ── 3 NEW EXODIA CARDS IN THE 0.01% PACK POOL (not owner-locked) ───────
  { id: "exodius-relic-eye", name: "Eye of Exodia", type: "Relic", rarity: "Exodius",
    atk: 0, def: 0, divinity: 98, set: "Genesis",
    lore: "A sixth relic whispered of in apocryphal scrolls. Its gaze unmakes lies.",
    ability: { name: "Mind-Bind", kind: "Bind", description: "Disables every opposing ability for the entire duel.", } },
  { id: "exodius-relic-heart", name: "Heart of Exodia", type: "Relic", rarity: "Exodius",
    atk: 0, def: 0, divinity: 98, set: "Genesis",
    lore: "Still beating in a jar of black glass. It remembers the first sin.",
    ability: { name: "Eternal Return", kind: "Resurrect", description: "Allied card returns once at 100% strength after defeat.", value: 100 } },
  { id: "exodius-relic-crown", name: "Crown of Exodia", type: "Relic", rarity: "Exodius",
    atk: 0, def: 0, divinity: 98, set: "Genesis",
    lore: "A diadem of fused suns. Whoever wears it dictates the order of strikes.",
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Allied cards always strike first and gain +400 ATK on the opening round.", value: 400 } },

  // ── 12 NEW LEGENDARY CARDS ──────────────────────────────────────────────
  { id: "amun-ra-prime", name: "Amun-Ra, Hidden Sun", type: "God", rarity: "Legendary", atk: 3900, def: 3600, divinity: 94, set: "Solar Dynasty", lore: "The unseen face of Ra, worshipped in darkness so the dawn may rise.",
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 1200 holy damage on summon, ignoring shields.", value: 1200 } },
  { id: "geb-earthfather", name: "Geb, Earth-Father", type: "God", rarity: "Legendary", atk: 3500, def: 3900, divinity: 91, set: "Genesis", lore: "The body of the world. Mountains rise where he turns in sleep.",
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reduces all incoming damage by 600 and reflects 30%.", value: 30 } },
  { id: "nut-skyborn", name: "Nut, Sky-Arched Mother", type: "God", rarity: "Legendary", atk: 3400, def: 3800, divinity: 92, set: "Genesis", lore: "Her body is the night sky, swallowing the sun each dusk and birthing it each dawn.",
    ability: { name: "Eternal Return", kind: "Resurrect", description: "All allied gods resurrect once at 50% strength.", value: 50 } },
  { id: "sekhmet-warlioness", name: "Sekhmet, War-Lioness", type: "God", rarity: "Legendary", atk: 4100, def: 3200, divinity: 90, set: "Desert War", lore: "The lion-headed wrath of Ra. She drank an ocean of red and asked for more.",
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice at 80% ATK per strike.", value: 80 } },
  { id: "apep-worldserpent", name: "Apep, World-Serpent", type: "Beast", rarity: "Legendary", atk: 4300, def: 3000, divinity: 88, set: "Underworld", lore: "Coiled around the underworld river, waiting to swallow the sun forever.",
    ability: { name: "Devour", kind: "Banish", description: "Banishes opponents with ATK below 2500 on summon.", value: 2500 } },
  { id: "atum-firstself", name: "Atum, the First Self", type: "God", rarity: "Legendary", atk: 3700, def: 3700, divinity: 95, set: "Genesis", lore: "He spoke himself into being and then spoke the rest of the gods.",
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the first 1500 damage taken by every allied card.", value: 1500 } },
  { id: "montu-falconwar", name: "Montu, Falcon of War", type: "Warrior", rarity: "Legendary", atk: 3800, def: 3300, divinity: 87, set: "Desert War", lore: "He rides a black bull and carries a sun-bladed khopesh.",
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "Strikes first and inflicts +700 ATK on the opening round.", value: 700 } },
  { id: "tefnut-rainfury", name: "Tefnut, Rain-Fury", type: "Mage", rarity: "Legendary", atk: 3600, def: 3500, divinity: 89, set: "Nile Court", lore: "Goddess of moisture and rage. Drought breaks where she screams.",
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 900 storm damage to every opposing card on summon.", value: 900 } },
  { id: "shu-skybearer", name: "Shu, Sky-Bearer", type: "God", rarity: "Legendary", atk: 3300, def: 4000, divinity: 86, set: "Genesis", lore: "He holds the sky off the earth so mortals may breathe.",
    ability: { name: "Bedrock Stance", kind: "Counter", description: "Reflects 40% of incoming damage. Cannot be pierced.", value: 40 } },
  { id: "hathor-goldcow", name: "Hathor, Gold-Cow of Joy", type: "God", rarity: "Legendary", atk: 3400, def: 3700, divinity: 90, set: "Solar Dynasty", lore: "Joy, music, and the milky way poured from her horns.",
    ability: { name: "Heart-Drain", kind: "Drain", description: "Heals allied cards for 50% of damage dealt.", value: 50 } },
  { id: "ptah-2-hammer", name: "Ptah, Hammer of Worlds", type: "God", rarity: "Legendary", atk: 3700, def: 3800, divinity: 93, set: "Genesis", variant: "Hammer Edition",
    lore: "Same architect — different mood. Today he tears down.",
    ability: { name: "Bone-Cleave", kind: "Pierce", description: "Excess damage past DEF deals 80% of overflow to vitality.", value: 80 } },
  { id: "horus-eclipse", name: "Horus, Twin-Eyed", type: "God", rarity: "Legendary", atk: 3700, def: 3500, divinity: 91, set: "Solar Dynasty", variant: "Twin-Eyed",
    lore: "Both sun-eye and moon-eye open. The sky bows with neither dawn nor dusk.",
    ability: { name: "Blood-Moon Eclipse", kind: "Eclipse", description: "Swaps ATK and DEF on every opposing card for one round.", } },

  // ── 20 NEW DIVINE CARDS ─────────────────────────────────────────────────
  ...["Renenutet, Serpent Mother","Sopdu, Star of the East","Hapi, Lord of the Flood","Bes, Dwarf-God of Hearths","Mafdet, Lynx of Justice","Pakhet, Night-Stalker","Heka, Word-Mage","Seshat, Measurer of Time","Min, Lord of the Harvest","Iat, Milkmaid of the Stars","Renpet, Year-Bringer","Ihy, Sistrum Child","Babi, Baboon of Souls","Wepwawet, Opener of Ways","Mnevis, Black Bull","Banebdjedet, Four-Headed Ram","Heqet, Frog-Goddess","Maahes, Lion of the Sun","Wadj-Wer, Great Green","Tatenen, Risen Earth"]
    .map((name, i) => ({
      id: `divine-${i+1}-${name.toLowerCase().split(",")[0].replace(/[^a-z]/g,"-")}`,
      name, type: (["God","Mage","Beast","Warrior","Spell"] as CardType[])[i % 5],
      rarity: "Divine" as Rarity,
      atk: 2500 + ((i*137) % 800), def: 2400 + ((i*89) % 900), divinity: 70 + (i % 20),
      set: ["Solar Dynasty","Underworld","Nile Court","Desert War","Moonlit Temple","Hidden Library","Genesis"][i % 7],
      lore: `${name} — divine pillar of the dynasty, sworn to the Pharaoh's seal.`,
      ability: [
        { name: "Solar Smite", kind: "Smite" as AbilityKind, description: "Deals 600 holy damage on summon.", value: 600 },
        { name: "Ankh Ward", kind: "DivineShield" as AbilityKind, description: "Negates the first 900 damage taken.", value: 900 },
        { name: "Heart-Drain", kind: "Drain" as AbilityKind, description: "Heals 35% of damage dealt.", value: 35 },
        { name: "Falcon Strike", kind: "FirstStrike" as AbilityKind, description: "Strikes first and adds +400 ATK to opener.", value: 400 },
        { name: "Twin Fang", kind: "DoubleStrike" as AbilityKind, description: "Attacks twice at 65% ATK per hit.", value: 65 },
        { name: "Bone-Cleave", kind: "Pierce" as AbilityKind, description: "Overflow past DEF deals 55% to vitality.", value: 55 },
        { name: "Inkbound Counter", kind: "Counter" as AbilityKind, description: "Reflects 35% of incoming damage.", value: 35 },
      ][i % 7],
    })),

  // ── 25 NEW RARE CARDS (more rares as requested) ─────────────────────────
  ...["Ipet, Hippopotamus Matron","Andjety, Standard-Bearer","Mehit, Lioness of Thinis","Tatet, Linen-Weaver","Kebechet, Cool-Water","Wenet, Hare of the Underworld","Meretseger, Cobra of the Peak","Nehebkau, Coiled Soul","Khnum, Potter of Souls","Heret-Kau, Watcher of Spirits","Imhotep, Stone-Mason","Mafet, Talon Scout","Sopd, Border Hawk","Iah, Crescent Walker","Heh, Eternity Counter","Pataikos, Charm of Iron","Bata, Bull-Hearted","Yam, Sea-Caller","Resheph, War-Spear","Anuket, Antelope of the Cataract","Satet, Arrow of the Nile","Nekhbet, White Vulture","Mehet-Weret, Cosmic Cow","Nephthys, Lady of the West","Werethekau, Great Enchantress"]
    .map((name, i) => ({
      id: `rare-${i+1}-${name.toLowerCase().split(",")[0].replace(/[^a-z]/g,"-")}`,
      name, type: (["Warrior","Beast","Mage","Spell","Trap","Seal","Field"] as CardType[])[i % 7],
      rarity: "Rare" as Rarity,
      atk: 1800 + ((i*113) % 700), def: 1700 + ((i*71) % 700), divinity: 45 + (i % 25),
      set: ["Solar Dynasty","Underworld","Nile Court","Desert War","Moonlit Temple","Hidden Library","Tomb Watch","Gates of Giza","Eagle's Pass"][i % 9],
      lore: `${name} answers the Pharaoh's summons from the lesser pantheon.`,
      ability: [
        { name: "Venom Bite", kind: "Burn" as AbilityKind, description: "Deals 350 burn damage that ignores DEF.", value: 350 },
        { name: "Backstrike", kind: "Pierce" as AbilityKind, description: "Overflow past DEF deals 45% to vitality.", value: 45 },
        { name: "Carapace", kind: "DivineShield" as AbilityKind, description: "Negates the first 500 damage taken.", value: 500 },
        { name: "Pack Hunt", kind: "DoubleStrike" as AbilityKind, description: "Attacks twice at 55% ATK per hit.", value: 55 },
        { name: "Stoop Dive", kind: "FirstStrike" as AbilityKind, description: "Strikes first with +250 ATK.", value: 250 },
        { name: "Death Roll", kind: "Drain" as AbilityKind, description: "Heals 30% of damage dealt.", value: 30 },
      ][i % 6],
    })),

  // ── 12 NEW SPELL / TRAP / SEAL CARDS ────────────────────────────────────
  { id: "spell-sun-disc", name: "Disc of the Living Sun", type: "Spell", rarity: "Divine", atk: 0, def: 1200, divinity: 65, set: "Solar Dynasty", lore: "A gold disc that hums at noon and screams at dawn.",
    ability: { name: "Solar Smite", kind: "Smite", description: "Deals 1000 holy burst damage to every opposing card.", value: 1000 } },
  { id: "spell-river-curse", name: "Curse of the Black Nile", type: "Spell", rarity: "Rare", atk: 0, def: 800, divinity: 40, set: "Nile Court", lore: "The river runs ink. The fish remember names.",
    ability: { name: "Heart-Drain", kind: "Drain", description: "All allied Beasts heal 40% of damage dealt this duel.", value: 40 } },
  { id: "spell-pharaohs-decree", name: "Decree of the Pharaoh", type: "Spell", rarity: "Divine", atk: 0, def: 1500, divinity: 80, set: "Pharaoh's Seal", lore: "A single sealed papyrus. The seal once broken cannot be re-tied.",
    ability: { name: "Mind-Bind", kind: "Bind", description: "Silences the opposing strongest card for the entire duel.", } },
  { id: "spell-judgment-fire", name: "Judgment Fire", type: "Spell", rarity: "Rare", atk: 0, def: 600, divinity: 50, set: "Underworld", lore: "Burns only those whose hearts weigh more than the feather.",
    ability: { name: "Hall of Two Truths", kind: "Judgment", description: "Opponents under 55 Divinity take +600 damage.", value: 600 } },
  { id: "trap-pit-of-jackals", name: "Pit of the Jackals", type: "Trap", rarity: "Rare", atk: 0, def: 1100, divinity: 35, set: "Desert War", lore: "A hole dug between the dunes. The desert never gives the body back.",
    ability: { name: "Devour", kind: "Banish", description: "Banishes the next opposing card with ATK below 1800.", value: 1800 } },
  { id: "trap-locked-tomb", name: "Sealed Tomb", type: "Trap", rarity: "Divine", atk: 0, def: 2200, divinity: 70, set: "Tomb Watch", lore: "Once shut, no key answers. Even the architect was buried with it.",
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "Negates the next 1400 damage taken by any allied card.", value: 1400 } },
  { id: "trap-mirror-pool", name: "Mirror Pool of Kemet", type: "Trap", rarity: "Rare", atk: 0, def: 900, divinity: 45, set: "Hidden Library", lore: "Strike your reflection and you strike yourself.",
    ability: { name: "Inkbound Counter", kind: "Counter", description: "Reflects 50% of the next incoming strike.", value: 50 } },
  { id: "trap-cobra-coil", name: "Cobra Coil", type: "Trap", rarity: "Common", atk: 0, def: 500, divinity: 18, set: "Nile Court", lore: "Soft enough to step on, sharp enough to remember.",
    ability: { name: "Venom Bite", kind: "Burn", description: "Deals 200 venom damage to the next attacker.", value: 200 } },
  { id: "seal-of-time", name: "Seal of Frozen Hours", type: "Seal", rarity: "Divine", atk: 0, def: 1800, divinity: 75, set: "Pharaoh's Seal", lore: "A line drawn through a sunbeam. Time forgets to cross it.",
    ability: { name: "Mind-Bind", kind: "Bind", description: "Disables every opposing ability for one round.", } },
  { id: "seal-scarab-king", name: "Seal of the Scarab King", type: "Seal", rarity: "Rare", atk: 0, def: 1300, divinity: 50, set: "Desert War", lore: "Press the seal into wet clay and an army of beetles answers.",
    ability: { name: "Carapace", kind: "DivineShield", description: "Negates the first 800 damage taken by all allied Beasts.", value: 800 } },
  { id: "seal-falcon-cry", name: "Seal of the Falcon Cry", type: "Seal", rarity: "Rare", atk: 0, def: 1100, divinity: 55, set: "Eagle's Pass", lore: "A shrill note that lifts every allied bird from the cliffs.",
    ability: { name: "Falcon Strike", kind: "FirstStrike", description: "All allied Warriors strike first this duel.", } },
  { id: "seal-sun-fang", name: "Seal of the Sun-Fang", type: "Seal", rarity: "Divine", atk: 0, def: 1600, divinity: 72, set: "Solar Dynasty", lore: "A bite mark in molten gold. Touch it and your shadow burns first.",
    ability: { name: "Solar Burn", kind: "Burn", description: "Deals 700 burn damage to the opposing field card each round.", value: 700 } },

  // ── 5 NEW FIELD CARDS ───────────────────────────────────────────────────
  { id: "field-valley-kings", name: "Valley of the Kings", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 65, set: "Tomb Watch", lore: "Every tomb door breathes. Together they exhale a dynasty.",
    ability: { name: "Eternal Return", kind: "Resurrect", description: "First allied card defeated returns at 70% strength.", value: 70 } },
  { id: "field-temple-karnak", name: "Pillars of Karnak", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 68, set: "Hidden Library", lore: "A forest of stone columns. Spells echo until they become true.",
    ability: { name: "Inkbound Counter", kind: "Counter", description: "Allied Spells and Seals reflect 25% extra damage.", value: 25 } },
  { id: "field-pyramid-giza", name: "Great Pyramid of Giza", type: "Field", rarity: "Legendary", atk: 0, def: 0, divinity: 80, set: "Gates of Giza", lore: "The summit pierces the firmament. The dead king is its compass.",
    ability: { name: "Ankh Ward", kind: "DivineShield", description: "All allied cards gain 600 DEF for the duel.", value: 600 } },
  { id: "field-oasis", name: "Oasis of Siwa", type: "Field", rarity: "Rare", atk: 0, def: 0, divinity: 40, set: "Desert War", lore: "Palms shimmer over impossible water. Wounded gods drink first.",
    ability: { name: "Heart-Drain", kind: "Drain", description: "All allied cards heal 15% of damage dealt while this field stands.", value: 15 } },
  { id: "field-moonlit-temple", name: "Moonlit Temple of Bastet", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 62, set: "Moonlit Temple", lore: "Cats walk where mortals are forbidden. Daggers fall faster here.",
    ability: { name: "Twin Fang", kind: "DoubleStrike", description: "Allied Beasts gain a second strike at 50% ATK.", value: 50 } },

  // ── 10 NEW COMMON CARDS ─────────────────────────────────────────────────
  ...["Nubian Archer","Reed-Cutter Slave","Desert Camel-Rider","Caravan Scout","Embalmer's Apprentice","Stonecarver of Memphis","Boy-Priest of Anubis","Sandal-Bearer","Oarsman of the Solar Barge","Net-Maker of the Delta"]
    .map((name, i) => ({
      id: `common-${i+1}-${name.toLowerCase().replace(/[^a-z]/g,"-")}`,
      name, type: (["Warrior","Beast","Spell","Mage","Warrior"] as CardType[])[i % 5],
      rarity: "Common" as Rarity,
      atk: 800 + ((i*97) % 700), def: 700 + ((i*61) % 700), divinity: 15 + (i % 20),
      set: ["Desert War","Nile Court","Tomb Watch","Hidden Library","Solar Dynasty"][i % 5],
      lore: `${name} — a common soul drawn into the Pharaoh's endless war.`,
      ability: [
        { name: "Backstrike", kind: "Pierce" as AbilityKind, description: "Overflow past DEF deals 35% to vitality.", value: 35 },
        { name: "Venom Bite", kind: "Burn" as AbilityKind, description: "Deals 150 burn damage that ignores DEF.", value: 150 },
        { name: "Linen Wrap", kind: "DivineShield" as AbilityKind, description: "Negates the first 250 damage taken.", value: 250 },
        { name: "Karnak Mend", kind: "Drain" as AbilityKind, description: "Heals 20% of damage dealt.", value: 20 },
        { name: "Pack Hunt", kind: "DoubleStrike" as AbilityKind, description: "Attacks twice at 50% ATK per hit.", value: 50 },
      ][i % 5],
    })),
];

// Assign rotating artwork and push into the main CARDS array.
EXPANSION.forEach((g, idx) => {
  CARDS.push({ ...g, art: ART_POOL[idx % ART_POOL.length] } as Card);
});

// ── SUPER EXPANSION: +150 cards (Yu-Gi-Oh-flavored mechanics, original lore) ─
// Spell, Trap, Seal, Tribute, Fusion, Draw, and dozens of new Beasts/Warriors.
// Every painting is reused across at most a handful of cards — variant labels
// keep them visually distinguishable until dedicated art is generated per card.

const SPELL_TRAP_CORE: Gen[] = [
  // ── BLACK VORTEX FAMILY (board wipes) ──
  { id: "spell-black-vortex", name: "Black Vortex of Set", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 80, set: "Pharaoh's Seal",
    lore: "A coil of obsidian wind. Every god, beast, and trap on the field is swallowed — friend and foe.",
    ability: { name: "Black Vortex", kind: "BoardWipe", description: "Destroys every non-Exodia card on the field, including your own. Exodia relics and owner-locked signatures are immune.", } },
  { id: "spell-desert-cataclysm", name: "Desert Cataclysm", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 55, set: "Desert War",
    lore: "The dunes rise as a wave and bury both armies.",
    ability: { name: "Black Vortex", kind: "BoardWipe", description: "Destroys every opposing Common and Rare card on the field.", } },
  { id: "spell-nile-tsunami", name: "Tsunami of the Nile", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 70, set: "Nile Court",
    lore: "The river breaks its banks and drowns the dynasty.",
    ability: { name: "Black Vortex", kind: "BoardWipe", description: "Destroys every opposing Beast and Warrior on the field.", } },

  // ── MIRROR OF ATEN FAMILY (reflect attacks) ──
  { id: "trap-mirror-of-aten", name: "Mirror of Aten", type: "Trap", rarity: "Divine", atk: 0, def: 1800, divinity: 75, set: "Solar Dynasty",
    lore: "A polished sun-disc. Every blade aimed at the Pharaoh kisses its bearer instead.",
    ability: { name: "Mirror of Aten", kind: "MirrorForce", description: "When the opponent declares an attack, reflects the full ATK back onto every opposing card in their lineup.", } },
  { id: "trap-mirror-osiris", name: "Mirror of Osiris", type: "Trap", rarity: "Rare", atk: 0, def: 1200, divinity: 60, set: "Underworld",
    lore: "A bronze disc engraved with the green king. Strikes return as judgment.",
    ability: { name: "Mirror of Aten", kind: "MirrorForce", description: "Reflects the next opposing attack at 75% strength back at the attacker.", value: 75 } },

  // ── VOICE OF THOTH FAMILY (negate spells) ──
  { id: "trap-voice-of-thoth", name: "Voice of Thoth", type: "Trap", rarity: "Divine", atk: 0, def: 1600, divinity: 80, set: "Hidden Library",
    lore: "The scribe-god clears his throat. Every word the opponent has written is erased.",
    ability: { name: "Voice of Thoth", kind: "SpellNegate", description: "Negates the next opposing Spell or Seal entirely.", } },
  { id: "trap-silent-scroll", name: "Silent Scroll", type: "Trap", rarity: "Rare", atk: 0, def: 900, divinity: 50, set: "Hidden Library",
    lore: "A sealed papyrus. While it remains shut, no spell may speak.",
    ability: { name: "Voice of Thoth", kind: "SpellNegate", description: "Negates the next opposing Common or Rare Spell.", } },

  // ── TOMB ROBBERY FAMILY (steal monsters) ──
  { id: "spell-tomb-robbery", name: "Tomb Robbery", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 65, set: "Tomb Watch",
    lore: "A jackal-headed thief slips through the wall. What he takes does not return.",
    ability: { name: "Tomb Robbery", kind: "MonsterSteal", description: "Takes control of one opposing card with ATK below 3000 for the rest of the duel.", value: 3000 } },
  { id: "spell-soul-binding", name: "Soul-Binding of Anubis", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 55, set: "Underworld",
    lore: "A linen rope wrapped seven times. Whoever holds it holds the heart.",
    ability: { name: "Tomb Robbery", kind: "MonsterSteal", description: "Takes control of one opposing card with ATK below 2000 for one round.", value: 2000 } },

  // ── TRIBUTE RITES (sacrifice for power) ──
  { id: "spell-tribute-rite", name: "Tribute Rite of the Forbidden", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 78, set: "Pharaoh's Seal",
    lore: "Lay three of your warriors on the altar. What rises is no longer yours to command — but it remembers your name.",
    ability: { name: "Tribute Rite", kind: "Tribute", description: "Sacrifice 3 allied non-God cards to summon a Tribute Avatar with combined ATK + 1500.", value: 1500 } },
  { id: "spell-tribute-pharaoh", name: "Pharaoh's Tribute", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 60, set: "Pharaoh's Seal",
    lore: "Two warriors kneel and the third rises in their place, twice the size.",
    ability: { name: "Tribute Rite", kind: "Tribute", description: "Sacrifice 2 allied Common cards. The next summoned card gains +800 ATK and +500 DEF.", value: 800 } },
  { id: "spell-tribute-blood", name: "Blood Tribute of Sekhmet", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 70, set: "Desert War",
    lore: "The lion-goddess drinks. The desert turns red. Your remaining warriors fight twice as hard.",
    ability: { name: "Tribute Rite", kind: "Tribute", description: "Sacrifice 1 allied Rare card. All allied Warriors gain +500 ATK this duel.", value: 500 } },

  // ── BREATH OF KHEPRI (life boost) ──
  { id: "spell-breath-khepri", name: "Breath of Khepri", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 50, set: "Solar Dynasty",
    lore: "The dawn-beetle exhales and your wounds knit shut.",
    ability: { name: "Breath of Khepri", kind: "LifeBoost", description: "Restores 1500 vitality to your duelist directly.", value: 1500 } },
  { id: "spell-ankh-revival", name: "Ankh of Revival", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 72, set: "Tomb Watch",
    lore: "A pendant warm to the touch. Worn long enough, even death loosens its grip.",
    ability: { name: "Breath of Khepri", kind: "LifeBoost", description: "Restores 3000 vitality and revives one defeated allied card at 30% strength.", value: 3000 } },

  // ── FORBIDDEN FUSION (Polymerize) ──
  { id: "spell-fusion-forbidden", name: "Forbidden Fusion", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 75, set: "Pharaoh's Seal",
    lore: "Two souls fed into one cauldron. What emerges has four eyes and no name.",
    ability: { name: "Forbidden Fusion", kind: "Polymerize", description: "Fuse two allied cards into a single Fusion Avatar with summed ATK and DEF, gaining FirstStrike.", } },
  { id: "spell-fusion-divine", name: "Divine Fusion of Ra-Horus", type: "Spell", rarity: "Legendary", atk: 0, def: 0, divinity: 92, set: "Solar Dynasty",
    lore: "Sun and sky braid into one falcon-wreathed god. The horizon cannot hold him.",
    ability: { name: "Forbidden Fusion", kind: "Polymerize", description: "Fuse two allied God cards into a Divine Avatar with summed ATK + 1000 and DoubleStrike.", value: 1000 } },

  // ── SCROLL OF ANUBIS (draw) ──
  { id: "spell-scroll-anubis", name: "Scroll of Anubis", type: "Spell", rarity: "Common", atk: 0, def: 0, divinity: 25, set: "Hidden Library",
    lore: "An inked papyrus that smells of myrrh. Reading it shows you the next page of the dynasty.",
    ability: { name: "Scroll of Anubis", kind: "Draw", description: "Draw 2 additional cards from your deck.", value: 2 } },
  { id: "spell-scroll-thoth", name: "Scroll of Thoth's Index", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 45, set: "Hidden Library",
    lore: "The scribe-god indexed every soul. This scroll lets you look up the next.",
    ability: { name: "Scroll of Anubis", kind: "Draw", description: "Draw 3 cards and reveal the top card of your opponent's deck.", value: 3 } },

  // ── PLAGUE OF SCARABS ──
  { id: "spell-plague-scarabs", name: "Plague of Sacred Scarabs", type: "Spell", rarity: "Rare", atk: 0, def: 0, divinity: 48, set: "Desert War",
    lore: "A black cloud of beetles. Armor rusts where they land.",
    ability: { name: "Plague of Scarabs", kind: "ScarabSwarm", description: "Reduces every opposing card's ATK by 300 for the entire duel.", value: 300 } },
  { id: "spell-plague-locust", name: "Locust Storm of Set", type: "Spell", rarity: "Divine", atk: 0, def: 0, divinity: 68, set: "Desert War",
    lore: "Set lifts his crook and the sky goes black with wings.",
    ability: { name: "Plague of Scarabs", kind: "ScarabSwarm", description: "Reduces every opposing card's ATK by 600 for the entire duel.", value: 600 } },

  // ── SANDSTORM / ECLIPSE VARIANTS ──
  { id: "field-eclipse-eternal", name: "Eternal Eclipse", type: "Field", rarity: "Legendary", atk: 0, def: 0, divinity: 88, set: "Moonlit Temple",
    lore: "The sun forgets to rise. Every blade swings backward.",
    ability: { name: "Blood-Moon Eclipse", kind: "Eclipse", description: "Swaps ATK and DEF on every opposing card for the entire duel.", } },
  { id: "field-sandstorm-thousand-suns", name: "Sandstorm of a Thousand Suns", type: "Field", rarity: "Divine", atk: 0, def: 0, divinity: 70, set: "Desert War",
    lore: "Glass rains from the sky. Every army goes blind together.",
    ability: { name: "Sandstorm", kind: "Sandstorm", description: "Reduces every opposing card's ATK by 800 for the entire duel.", value: 800 } },
];

// Generated batch — Beasts, Warriors, Mages, Spells, Traps for variety.
const NAMES_BATCH: { name: string; type: CardType; rarity: Rarity; set: string }[] = [
  // 30 new Beasts
  ...["Sandshark of Akhet","Tomb Spider","Cobra of Wadj-Wer","Lion-Cub of Sekhmet","Falcon-Hawk of Horus","Ibis of Thoth","Hippo of Taweret","Cat of Bastet","Bull of Apis","Vulture of Nekhbet","Jackal-Pup of Anubis","Ram of Khnum","Antelope of Anuket","Scarab Swarm","Ichneumon of the Delta","River-Crocodile","Black Cobra","Sand-Boa","Desert Lynx","Egret of the Reed Sea","Phoenix of Heliopolis","Griffin of Punt","Sphinx-Cub","Mau Stalker","Saluki Hound","Onyx Panther","Bat of the Tombs","Mongoose Trickster","Oryx of the Dunes","Hawk-Headed Wyrm"].map((n) => ({ name: n, type: "Beast" as CardType, rarity: "Common" as Rarity, set: "Desert War" })),
  // 25 new Warriors
  ...["Spear-Maiden of Thinis","Chariot-Captain","Khepesh Swordsman","Slinger of Nubia","Bow-Maiden of the Delta","Sword-Brother of Memphis","Standard-Bearer","Shield-Bearer","Falcon-Helm Sentinel","Bronze-Plated Guardian","Pharaoh's Bodyguard","Tomb Watchman","Mace-Wielder","Axeman of Set","Dagger-Twin","Linen-Wrapped Bladed","Tutor of the Boy-King","Captain of the Royal Barge","Spear-Phalanx Leader","Auxiliary Bowman","Sand-Skirmisher","Veteran Sergeant","Royal Guard Lance","Charioteer of Ra","Slinger-Captain"].map((n) => ({ name: n, type: "Warrior" as CardType, rarity: "Rare" as Rarity, set: "Desert War" })),
  // 25 new Mages
  ...["Hieroglyph-Singer","Star-Reader of Karnak","Dream-Walker of Bastet","Oracle of Siwa","Embalmer-Mage","Lapis Diviner","Salt-Witch of the Red Sea","Cat-Priestess","Heart-Weigher","Soul-Counter","Smoke-Weaver","Sand-Scryer","Moon-Caller","Sun-Channeler","Lapis Astronomer","Reed-Reader","Bone-Carver","Linen-Spinner","Ink-Speaker","Aten Devotee","Anubis Acolyte","Ra Acolyte","Osiris Devotee","Thoth Scribe","Isis Healer"].map((n) => ({ name: n, type: "Mage" as CardType, rarity: "Rare" as Rarity, set: "Hidden Library" })),
  // 20 new mid-tier Gods / Divines
  ...["Onuris, Lion-Hunter","Hedjhotep, Linen-Weaver","Bata, Bull of Persea","Hu, Word of Creation","Sia, Mind of Creation","Ihy of the Sistrum","Andjety, Standard-Bearer","Hatmehit, Fish-Mother","Ash, Lord of the Western Desert","Wenet, Hare-Goddess","Ipi, Mother of Tutankhamun","Mestjet, Lioness Twin","Mehet, Cosmic Cow Twin","Nehmetawy, Embracing Mother","Heret-Kau, Watcher Twin","Pakhet, Night-Stalker Twin","Renpet, Year-Bringer Twin","Sesmu, Lord of the Wine Press","Tutu, Master of Demons","Weret-Hekau, Great Enchantress Twin"].map((n) => ({ name: n, type: "God" as CardType, rarity: "Divine" as Rarity, set: "Hidden Library" })),
  // 25 new Spells
  ...["Solar Wind","Lapis Storm","Ankh of Stone","Crook & Flail","Cobra Diadem","Eye of Horus","Eye of Ra","Eye of Aten","Linen Shroud","Anubis Mask","Ibis Quill","Falcon Feather","Cat's-Eye Amulet","Ram's-Horn Amulet","Cartouche of Power","Was-Scepter","Djed Pillar","Tyet Knot","Menat Necklace","Heka-Wand","Lotus Censer","Papyrus Scroll","Solar Disc","Lunar Crescent","Star-Pendant"].map((n) => ({ name: n, type: "Spell" as CardType, rarity: "Rare" as Rarity, set: "Hidden Library" })),
  // 15 new Traps
  ...["Sand Pit","Tomb Snare","Cobra Strike","Mirror Snare","Scorpion Ambush","Fire Trap","Falling Stones","Sealed Door","Linen Garrote","Pit of Vipers","Bronze Snare","Lapis Snare","Solar Lens","Anubis Curse","Osiris Curse"].map((n) => ({ name: n, type: "Trap" as CardType, rarity: "Rare" as Rarity, set: "Tomb Watch" })),
  // 10 new Seals
  ...["Seal of the Cobra","Seal of the Hawk","Seal of the Ibis","Seal of the Bull","Seal of the Ram","Seal of the Lion","Seal of the Lotus","Seal of the Sun","Seal of the Moon","Seal of the Star"].map((n) => ({ name: n, type: "Seal" as CardType, rarity: "Rare" as Rarity, set: "Pharaoh's Seal" })),
];

const GENERATED_NAMED: Gen[] = NAMES_BATCH.map((row, i) => {
  const abilities: Ability[] = [
    { name: "Solar Burn", kind: "Burn", description: "Deals 350 burn damage that ignores DEF.", value: 350 },
    { name: "Twin Fang", kind: "DoubleStrike", description: "Attacks twice at 55% ATK per hit.", value: 55 },
    { name: "Bone-Cleave", kind: "Pierce", description: "Overflow past DEF deals 45% to vitality.", value: 45 },
    { name: "Ankh Ward", kind: "DivineShield", description: "Negates the first 600 damage taken.", value: 600 },
    { name: "Heart-Drain", kind: "Drain", description: "Heals 30% of damage dealt.", value: 30 },
    { name: "Falcon Strike", kind: "FirstStrike", description: "Strikes first with +300 ATK.", value: 300 },
    { name: "Inkbound Counter", kind: "Counter", description: "Reflects 30% of incoming damage.", value: 30 },
    { name: "Hall of Two Truths", kind: "Judgment", description: "Opponents under 50 Divinity take +500 damage.", value: 500 },
    { name: "Plague of Scarabs", kind: "ScarabSwarm", description: "Reduces opposing ATK by 150.", value: 150 },
    { name: "Scroll of Anubis", kind: "Draw", description: "Draw 1 additional card.", value: 1 },
    { name: "Voice of Thoth", kind: "SpellNegate", description: "Negates the next opposing Common Spell.", },
    { name: "Mirror of Aten", kind: "MirrorForce", description: "Reflects the next attack at 40%.", value: 40 },
  ];
  const rarityBase = row.rarity === "Divine" ? 2500 : row.rarity === "Rare" ? 1700 : 900;
  return {
    id: `gen-${i+1}-${row.name.toLowerCase().split(",")[0].replace(/[^a-z]/g, "-")}`,
    name: row.name, type: row.type, rarity: row.rarity, set: row.set,
    atk: rarityBase + ((i * 137) % 700),
    def: rarityBase - 200 + ((i * 89) % 700),
    divinity: (row.rarity === "Divine" ? 70 : row.rarity === "Rare" ? 45 : 22) + (i % 18),
    lore: `${row.name} — sworn to the dynasty, summoned by the Pharaoh's banner.`,
    ability: abilities[i % abilities.length],
  };
});

const SUPER_EXPANSION = [...SPELL_TRAP_CORE, ...GENERATED_NAMED];

SUPER_EXPANSION.forEach((g, idx) => {
  // Offset the art rotation so this batch doesn't mirror EXPANSION exactly.
  CARDS.push({ ...g, art: g.art ?? ART_POOL[(idx + 7) % ART_POOL.length] } as Card);
});

// Default ownership = false for every account. The vault page decides what to
// show per-user (owner/admin gets the full roster; regular users start empty
// and earn cards through packs / drops / play). ownerOnly cards stay locked
// to the Pharaoh's signature roster regardless of who is viewing.
CARDS.forEach((c) => {
  c.owned = false;
  c.price = c.rarity === "Exodius" ? 50000
    : c.rarity === "Legendary" ? 12000
    : c.rarity === "Divine" ? 3500
    : c.rarity === "Rare" ? 900
    : 120;
  // Owner-locked cards are never tradeable and never priced for the public market.
  if (c.ownerOnly) { c.price = undefined; }
});

export const RARITIES: Rarity[] = ["Common", "Rare", "Divine", "Legendary", "Exodius"];
export const TYPES: CardType[] = ["God", "Spell", "Trap", "Relic", "Beast", "Warrior", "Mage"];
export const SETS = Array.from(new Set(CARDS.map((c) => c.set)));

export function rarityLabel(rarity: Rarity | string | null | undefined) {
  return rarity === "Exodius" ? "Exodia" : rarity ?? "—";
}

// ── Elements ────────────────────────────────────────────────────────────
// Every card respects an elemental affinity. Used by the battle calculator
// (elemental advantage grants bonus XP) and by the card detail page.
export type Element = "Fire" | "Water" | "Earth" | "Air" | "Light" | "Shadow" | "Divine" | "Time";

export const ELEMENT_META: Record<Element, { glyph: string; color: string; tint: string; counters: Element[] }> = {
  Fire:   { glyph: "🔥", color: "text-orange-400",  tint: "bg-orange-500/10 border-orange-500/40", counters: ["Air", "Earth"] },
  Water:  { glyph: "💧", color: "text-sky-300",     tint: "bg-sky-500/10 border-sky-500/40",       counters: ["Fire"] },
  Earth:  { glyph: "⛰️", color: "text-amber-500",   tint: "bg-amber-700/10 border-amber-700/40",   counters: ["Water"] },
  Air:    { glyph: "🌪️", color: "text-cyan-200",    tint: "bg-cyan-400/10 border-cyan-400/40",     counters: ["Earth"] },
  Light:  { glyph: "☀️", color: "text-yellow-300",  tint: "bg-yellow-400/10 border-yellow-400/40", counters: ["Shadow"] },
  Shadow: { glyph: "🌑", color: "text-purple-300",  tint: "bg-purple-700/10 border-purple-700/40", counters: ["Light"] },
  Divine: { glyph: "✨", color: "text-accent",      tint: "bg-accent/10 border-accent/40",         counters: ["Shadow", "Fire"] },
  Time:   { glyph: "⏳", color: "text-fuchsia-300", tint: "bg-fuchsia-700/10 border-fuchsia-700/40", counters: ["Fire","Water","Earth","Air","Light","Shadow","Divine"] },
};

// Deterministic element assignment based on card identity.
const ELEMENT_BY_ID: Record<string, Element> = {
  ra: "Fire", "ra-variant": "Fire", horus: "Air", khonsu: "Light", khepri: "Light", bastet: "Shadow",
  osiris: "Shadow", anubis: "Shadow", mummy: "Shadow", ammit: "Shadow", "ammit-2": "Shadow", shadow: "Shadow", tahu: "Shadow",
  set: "Earth", sphinx: "Earth", scarab: "Earth", jackal: "Earth", colossus: "Earth", eagle: "Air", khaba: "Earth",
  sobek: "Water", serpent: "Water", wadjet: "Water",
  thoth: "Air", isis: "Water", neith: "Air", nefari: "Air", priest: "Light", "kemet-priest": "Light", "ma-at": "Light",
  ptah: "Divine",
  "ex-head": "Divine", "ex-rarm": "Divine", "ex-larm": "Divine", "ex-rleg": "Divine", "ex-lleg": "Divine",
  psycronos: "Time", khadija: "Light",
  "field-sandscape": "Earth", "field-blood-moon": "Shadow", "field-hall-two-truths": "Shadow", "field-nile-flood": "Water",
  "seal-mirror": "Light", "seal-ankh-ward": "Light", "seal-locust": "Earth", "seal-binding": "Shadow",
};

export function elementOf(card: Card): Element {
  return ELEMENT_BY_ID[card.id] ?? "Divine";
}

// Returns true if attacker's element counters defender's element (bonus XP / micro-damage).
export function hasElementalAdvantage(attacker: Card, defender: Card): boolean {
  return ELEMENT_META[elementOf(attacker)].counters.includes(elementOf(defender));
}

// ── Effect tier (symbol shown on every thumbnail) ──────────────────────
// Lets players read at a glance whether a card's effect is mythic / major / notable / minor.
export type EffectTier = "Mythic" | "Major" | "Notable" | "Minor" | "None";

export const EFFECT_TIER_META: Record<EffectTier, { glyph: string; color: string; label: string }> = {
  Mythic:  { glyph: "★", color: "text-accent",       label: "Mythic effect — duel-defining" },
  Major:   { glyph: "◆", color: "text-gold",         label: "Major effect — game-changing" },
  Notable: { glyph: "✦", color: "text-bronze",       label: "Notable effect — situational power" },
  Minor:   { glyph: "•", color: "text-muted-foreground", label: "Minor effect — small advantage" },
  None:    { glyph: "",  color: "",                  label: "No active effect" },
};

export function effectTierOf(card: Card): EffectTier {
  if (!card.ability) return "None";
  if (card.rarity === "Exodius" || card.rarity === "Legendary") return "Mythic";
  if (card.rarity === "Divine") return "Major";
  if (card.rarity === "Rare") return "Notable";
  return "Minor";
}

export function getCardById(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

// Backfill elements for the generated expansion cards (must run AFTER
// ELEMENT_BY_ID is declared above).
for (const c of CARDS) {
  if (ELEMENT_BY_ID[c.id]) continue;
  const n = (c.name + " " + c.set).toLowerCase();
  let el: Element = "Divine";
  if (/sun|solar|ra |fire|flame|burn|sekhmet|montu/.test(n)) el = "Fire";
  else if (/nile|water|river|sea|flood|hapi|sobek|cobra|serpent/.test(n)) el = "Water";
  else if (/sand|earth|stone|pyramid|valley|tomb|bull|geb|mountain/.test(n)) el = "Earth";
  else if (/sky|falcon|eagle|hawk|wind|storm|shu|nut|cloud/.test(n)) el = "Air";
  else if (/moon|night|shadow|dark|jackal|underworld|nephthys/.test(n)) el = "Shadow";
  else if (/dawn|light|gold|temple|priest|hathor|isis/.test(n)) el = "Light";
  else if (/pharaoh|seal|forbidden|exodius/.test(n)) el = "Time";
  (ELEMENT_BY_ID as Record<string, Element>)[c.id] = el;
}

// ───────────────────────────────────────────────────────────────────────
// YGO-style metadata: Attribute, Monster Type, Level/Stars, Spell/Trap
// subtype, and 7-tier display rarity. All derived from existing data so
// every card in CARDS resolves without manual data entry.
// ───────────────────────────────────────────────────────────────────────

export type Attribute = "FIRE" | "WATER" | "EARTH" | "WIND" | "LIGHT" | "DARK" | "DIVINE";

export const ATTRIBUTE_META: Record<Attribute, { glyph: string; color: string; tint: string }> = {
  FIRE:   { glyph: "🜂", color: "text-orange-400",  tint: "bg-orange-500/15 border-orange-500/50" },
  WATER:  { glyph: "🜄", color: "text-sky-300",     tint: "bg-sky-500/15 border-sky-500/50" },
  EARTH:  { glyph: "🜃", color: "text-amber-500",   tint: "bg-amber-700/15 border-amber-700/50" },
  WIND:   { glyph: "🜁", color: "text-cyan-200",    tint: "bg-cyan-400/15 border-cyan-400/50" },
  LIGHT:  { glyph: "☀",  color: "text-yellow-200",  tint: "bg-yellow-300/15 border-yellow-300/50" },
  DARK:   { glyph: "☾",  color: "text-purple-300",  tint: "bg-purple-700/15 border-purple-700/50" },
  DIVINE: { glyph: "✶",  color: "text-accent",      tint: "bg-accent/15 border-accent/60" },
};

const ELEMENT_TO_ATTRIBUTE: Record<Element, Attribute> = {
  Fire: "FIRE", Water: "WATER", Earth: "EARTH", Air: "WIND",
  Light: "LIGHT", Shadow: "DARK", Divine: "DIVINE", Time: "DIVINE",
};

export function attributeOf(card: Card): Attribute {
  return ELEMENT_TO_ATTRIBUTE[elementOf(card)];
}

// Monster sub-types (YGO-style). Spells/Traps/Fields/Seals return null.
export type MonsterType =
  | "Divine-Beast" | "Spellcaster" | "Warrior" | "Beast" | "Winged Beast"
  | "Reptile" | "Aqua" | "Rock" | "Fiend" | "Fairy" | "Dragon" | "Zombie";

const TYPE_KEYWORDS: Array<[RegExp, MonsterType]> = [
  [/dragon|wyrm|serpent dragon|apophis/, "Dragon"],
  [/cobra|serpent|crocodile|sobek|hippo|reptile|lizard/, "Reptile"],
  [/falcon|hawk|eagle|vulture|ibis|winged|sky|bennu/, "Winged Beast"],
  [/lion|jackal|hyena|cat|bastet|sphinx|scarab|beast|oryx|ammit/, "Beast"],
  [/mummy|tomb|grave|wraith|specter|phantom|ghost|undead/, "Zombie"],
  [/priest|priestess|scribe|mage|sorcer|witch|oracle|prophet|thoth|isis|heka/, "Spellcaster"],
  [/warrior|guard|spearman|knight|warden|hustler|gunner|sentinel|champion|rider|hunter/, "Warrior"],
  [/stone|colossus|statue|rock|granite/, "Rock"],
  [/nile|water|river|sea|aqua/, "Aqua"],
  [/demon|fiend|devour|shadow lord|nightmare/, "Fiend"],
  [/angel|fairy|seraph|herald|maat/, "Fairy"],
];

export function monsterTypeOf(card: Card): MonsterType | null {
  if (card.type === "Spell" || card.type === "Trap" || card.type === "Field" || card.type === "Seal") return null;
  if (card.type === "God") return card.rarity === "Legendary" ? "Divine-Beast" : "Spellcaster";
  if (card.type === "Relic") return "Divine-Beast";
  if (card.type === "Mage") return "Spellcaster";
  if (card.type === "Warrior") return "Warrior";
  if (card.type === "Beast") {
    const n = card.name.toLowerCase();
    for (const [re, t] of TYPE_KEYWORDS) if (re.test(n)) return t;
    return "Beast";
  }
  const n = (card.name + " " + card.set).toLowerCase();
  for (const [re, t] of TYPE_KEYWORDS) if (re.test(n)) return t;
  return "Warrior";
}

// Level 1–12 derived from divinity + ATK. Exodia relics are level 12.
export function levelOf(card: Card): number {
  if (card.type === "Spell" || card.type === "Trap" || card.type === "Field" || card.type === "Seal") return 0;
  if (card.rarity === "Exodius") return 12;
  if (card.rarity === "Legendary") return Math.min(12, 9 + Math.floor(card.divinity / 40));
  if (card.rarity === "Divine")    return Math.min(10, 7 + Math.floor(card.divinity / 40));
  if (card.rarity === "Rare")      return Math.min(7, 4 + Math.floor(card.atk / 900));
  return Math.max(1, Math.min(4, 1 + Math.floor(card.atk / 600)));
}

export type SpellSubtype = "Normal" | "Continuous" | "Equip" | "Field" | "Quick-Play" | "Ritual";
export type TrapSubtype  = "Normal" | "Continuous" | "Counter";

export const SPELL_SUBTYPE_META: Record<SpellSubtype, { glyph: string; label: string }> = {
  Normal:       { glyph: "•",  label: "Normal Spell" },
  Continuous:   { glyph: "∞",  label: "Continuous Spell" },
  Equip:        { glyph: "✝",  label: "Equip Spell" },
  Field:        { glyph: "✥",  label: "Field Spell" },
  "Quick-Play": { glyph: "⚡", label: "Quick-Play Spell" },
  Ritual:       { glyph: "🜍", label: "Ritual Spell" },
};

export const TRAP_SUBTYPE_META: Record<TrapSubtype, { glyph: string; label: string; speed: 2 | 3 }> = {
  Normal:     { glyph: "▲", label: "Normal Trap",     speed: 2 },
  Continuous: { glyph: "∞", label: "Continuous Trap", speed: 2 },
  Counter:    { glyph: "↺", label: "Counter Trap",    speed: 3 },
};

export function spellSubtypeOf(card: Card): SpellSubtype | null {
  if (card.type === "Field") return "Field";
  if (card.type !== "Spell") return null;
  const k = card.ability?.kind;
  if (k === "Polymerize") return "Ritual";
  if (k === "Draw" || k === "Burn" || k === "Smite" || k === "LifeBoost") return "Quick-Play";
  if (k === "Sandstorm" || k === "Eclipse" || k === "ScarabSwarm") return "Continuous";
  if (k === "DivineShield") return "Equip";
  return "Normal";
}

export function trapSubtypeOf(card: Card): TrapSubtype | null {
  if (card.type !== "Trap" && card.type !== "Seal") return null;
  const k = card.ability?.kind;
  if (k === "SpellNegate" || k === "Bind") return "Counter";
  if (k === "MirrorForce" || k === "Counter") return "Normal";
  return "Continuous";
}

// ── 7-tier display rarity ──────────────────────────────────────────────
// Maps our 5 internal tiers onto YGO's 7-tier visual ladder, splitting
// Legendary into Ultra/Ultimate (variant or ownerOnly → Ultimate) and
// Exodius into Secret/Ghost (variant → Ghost).
export type DisplayRarity =
  | "Common" | "Rare" | "Super Rare" | "Ultra Rare"
  | "Secret Rare" | "Ultimate Rare" | "Ghost Rare";

export const DISPLAY_RARITY_META: Record<DisplayRarity, { color: string; label: string; ring: string }> = {
  Common:          { color: "text-muted-foreground", label: "Common",         ring: "ring-stone/40" },
  Rare:            { color: "text-silver",           label: "Rare",           ring: "ring-silver/60" },
  "Super Rare":    { color: "text-silver",           label: "Super Rare",     ring: "ring-silver/80" },
  "Ultra Rare":    { color: "text-gold",             label: "Ultra Rare",     ring: "ring-gold/70" },
  "Secret Rare":   { color: "text-accent",           label: "Secret Rare",    ring: "ring-accent/70" },
  "Ultimate Rare": { color: "text-gold",             label: "Ultimate Rare",  ring: "ring-gold/90" },
  "Ghost Rare":    { color: "text-foreground",       label: "Ghost Rare",     ring: "ring-foreground/40" },
};

export function displayRarityOf(card: Card): DisplayRarity {
  if (card.rarity === "Exodius") return card.variant ? "Ghost Rare" : "Secret Rare";
  if (card.rarity === "Legendary") return card.ownerOnly || card.variant ? "Ultimate Rare" : "Ultra Rare";
  if (card.rarity === "Divine") return "Super Rare";
  if (card.rarity === "Rare") return "Rare";
  return "Common";
}
