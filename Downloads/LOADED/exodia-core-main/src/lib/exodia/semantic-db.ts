// Semantic entity database for the EXODIA reality engine.
// Pure data — no side effects, safe to import anywhere.

export type EntityDef = {
  ai_type?: string;
  movement?: string;
  attack?: string;
  skeleton?: string;
  terrain?: string;
  hazard?: string;
  particles?: string;
  sound?: string;
  rooms?: string[];
  effects?: string[];
  /** Scene representation: marker color + glyph */
  marker?: { color: string; glyph: string };
  /** For weather entities */
  valid_range?: [number, number];
};

export const SEMANTIC_DB: Record<string, EntityDef> = {
  dragon: {
    ai_type: "PREDATOR",
    movement: "flying",
    attack: "fire",
    skeleton: "large_beast",
    effects: ["fire_breath", "ember_particles"],
    marker: { color: "#ff4d4d", glyph: "🐉" },
  },
  volcano: {
    terrain: "mountain",
    hazard: "lava",
    particles: "smoke_eruption",
    sound: "deep_rumble",
    effects: ["smoke_plume", "lava_glow"],
    marker: { color: "#ff7a18", glyph: "🌋" },
  },
  hospital: {
    ai_type: "civilian",
    rooms: ["emergency", "surgery", "hallway", "lobby"],
    marker: { color: "#7dd3fc", glyph: "✚" },
  },
  city: {
    ai_type: "population",
    effects: ["neon_grid", "traffic_pulse"],
    marker: { color: "#a78bfa", glyph: "▣" },
  },
  river: {
    terrain: "waterway",
    marker: { color: "#38bdf8", glyph: "≈" },
  },
  biome: {
    terrain: "region",
    marker: { color: "#4ade80", glyph: "❋" },
  },
  npc: {
    ai_type: "civilian",
    marker: { color: "#fbbf24", glyph: "☻" },
  },
  vehicle: {
    movement: "ground",
    marker: { color: "#94a3b8", glyph: "▶" },
  },
  tower: {
    skeleton: "structure",
    marker: { color: "#e879f9", glyph: "▲" },
  },
  planet: {
    terrain: "celestial",
    marker: { color: "#60a5fa", glyph: "◯" },
  },
  atmosphere: {
    terrain: "gas_layer",
    marker: { color: "#22d3ee", glyph: "≋" },
  },
  storm: {
    hazard: "wind_rain",
    effects: ["lightning", "rain_band"],
    marker: { color: "#22d3ee", glyph: "⛈" },
    valid_range: [1, 5],
  },
  tornado: {
    hazard: "vortex",
    effects: ["funnel", "debris"],
    marker: { color: "#94a3b8", glyph: "🌪" },
    valid_range: [1, 5],
  },
  hurricane: {
    hazard: "cyclone",
    effects: ["eyewall", "storm_surge"],
    marker: { color: "#60a5fa", glyph: "🌀" },
    valid_range: [1, 5],
  },
};

export const DESCRIPTORS = new Set([
  "giant",
  "huge",
  "gigantic",
  "tiny",
  "small",
  "robotic",
  "flaming",
  "frozen",
  "abandoned",
  "futuristic",
  "cyberpunk",
  "corrupted",
  "unstable",
  "ancient",
  "neon",
]);

export const ACTIONS = new Set([
  "spawn",
  "create",
  "destroy",
  "modify",
  "generate",
  "simulate",
  "analyze",
  "debug",
  "weather",
  "ai",
  "stream",
  "help",
  "errors",
  "governance",
  "audit",
]);

export function entityExists(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SEMANTIC_DB, name.toLowerCase());
}

export function getEntity(name: string): EntityDef | undefined {
  return SEMANTIC_DB[name.toLowerCase()];
}
