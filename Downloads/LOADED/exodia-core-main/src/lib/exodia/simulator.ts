import { dispatchScene } from "@/lib/scene-bus";
import { fmtError, type ExodiaError } from "./error-engine";
import { parse, type ParsedPlan } from "./parser";
import { getEntity as getDef } from "./semantic-db";
import {
  addEntity,
  canSpawn,
  getEntity,
  listAudit,
  listEntities,
  listErrors,
  logError,
  nextId,
  removeEntity,
} from "./registry";
import { rateLimitOk, record, isStrict, toggleStrict } from "./governance";
import { listAudit as listGovAudit } from "@/lib/governance/audit";

export type ExodiaResult = {
  display: string;
  kind: "success" | "error" | "info";
};

const HELP = `◆ EXODIA REALITY ENGINE
  //help                              show this card
  //spawn <entity> [descriptors] [lat lng]
  //create <entity> [descriptors] [name] [lat lng]
  //generate <entity> [descriptors]
  //weather <storm|tornado|hurricane> categoryN [lat lng]
  //destroy <ENTITY_ID>
  //debug                              dump registry + audit
  //errors                             last 20 failures
  //audit                              governance audit log
  //governance                         toggle strict mode

  Entities: dragon volcano hospital city river biome npc vehicle tower planet
            atmosphere storm tornado hurricane
  Descriptors: giant huge tiny robotic flaming frozen abandoned futuristic
               cyberpunk corrupted unstable ancient neon`;

export function runExodia(input: string): ExodiaResult {
  if (!rateLimitOk()) {
    const err: ExodiaError = {
      code: "EX_RATE_LIMIT",
      explanation: "Too many commands per second.",
      fix: "Wait a moment and retry.",
    };
    logError(input, err);
    return { display: fmtError(err), kind: "error" };
  }

  const result = parse(input);
  record(`parse ${input}`);

  if (!result.ok) {
    logError(input, result.error);
    return { display: fmtError(result.error), kind: "error" };
  }

  const { plan } = result;
  switch (plan.action) {
    case "help":
      return { display: HELP, kind: "info" };
    case "errors":
      return { display: renderErrors(), kind: "info" };
    case "audit":
      return { display: renderAudit(), kind: "info" };
    case "debug":
      return { display: renderDebug(), kind: "info" };
    case "governance": {
      const s = toggleStrict();
      return {
        display: `◆ governance.strict ⇒ ${s ? "ENABLED" : "DISABLED"}`,
        kind: "info",
      };
    }
    case "destroy":
      return doDestroy(plan);
    case "weather":
      return doWeather(plan, input);
    case "spawn":
    case "create":
    case "generate":
    case "simulate":
    case "modify":
      return doSpawn(plan, input);
    default:
      return { display: HELP, kind: "info" };
  }
}

function doSpawn(plan: ParsedPlan, input: string): ExodiaResult {
  if (!plan.entity) return { display: HELP, kind: "info" };
  if (isStrict() && !canSpawn()) {
    const err: ExodiaError = {
      code: "EX_MEMORY_OVERFLOW",
      explanation: "Entity cap reached (200).",
      fix: "//destroy <ID> to free a slot.",
    };
    logError(input, err);
    return { display: fmtError(err), kind: "error" };
  }
  const def = getDef(plan.entity)!;
  const id = nextId(plan.entity);
  const lat = plan.lat ?? randLat();
  const lng = plan.lng ?? randLng();

  addEntity({
    id,
    type: plan.entity,
    descriptors: plan.descriptors,
    lat,
    lng,
    meta: { name: plan.name },
    createdAt: Date.now(),
  });

  if (def.marker) {
    dispatchScene({
      type: "marker",
      lat,
      lng,
      label: `${def.marker.glyph} ${id}`,
      color: def.marker.color,
    });
  }
  if (plan.action === "create") {
    dispatchScene({ type: "focus", lat, lng });
  }

  record(`spawn ${id} @ ${lat.toFixed(2)},${lng.toFixed(2)}`);
  const effects = [...(def.effects ?? []), ...descriptorEffects(plan.descriptors)];

  const lines = [
    "◆ STATUS      SUCCESS",
    `  ENTITY_ID   ${id}`,
    `  TYPE        ${plan.entity}`,
  ];
  if (def.ai_type) lines.push(`  AI_PROFILE  ${def.ai_type}`);
  if (plan.descriptors.length)
    lines.push(`  TRAITS      ${plan.descriptors.join(", ")}`);
  if (effects.length) lines.push(`  EFFECTS     ${effects.join(", ")}`);
  lines.push(`  LOCATION    ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
  if (plan.name) lines.push(`  NAME        ${plan.name}`);
  return { display: lines.join("\n"), kind: "success" };
}

function doWeather(plan: ParsedPlan, input: string): ExodiaResult {
  const def = getDef(plan.entity!)!;
  const [lo, hi] = def.valid_range ?? [1, 5];
  if (plan.category! < lo || plan.category! > hi) {
    const err: ExodiaError = {
      code: "EX_INVALID_PARAMETER",
      explanation: `Maximum ${plan.entity} category exceeded.`,
      valid: `${lo}-${hi}`,
      fix: `//weather ${plan.entity} category${hi}`,
    };
    logError(input, err);
    return { display: fmtError(err), kind: "error" };
  }
  const id = nextId(plan.entity!);
  const lat = plan.lat ?? randLat();
  const lng = plan.lng ?? randLng();
  addEntity({
    id,
    type: plan.entity!,
    descriptors: [`category${plan.category}`],
    lat,
    lng,
    createdAt: Date.now(),
  });
  if (def.marker) {
    dispatchScene({
      type: "marker",
      lat,
      lng,
      label: `${def.marker.glyph} ${id} C${plan.category}`,
      color: def.marker.color,
    });
  }
  dispatchScene({ type: "satellite", name: id });
  record(`weather ${id} cat${plan.category}`);
  return {
    display: [
      "◆ STATUS      SUCCESS",
      `  ENTITY_ID   ${id}`,
      `  KIND        ${plan.entity}`,
      `  CATEGORY    ${plan.category}`,
      `  EFFECTS     ${(def.effects ?? []).join(", ")}`,
      `  LOCATION    ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
    ].join("\n"),
    kind: "success",
  };
}

function doDestroy(plan: ParsedPlan): ExodiaResult {
  const id = plan.targetId!;
  const ent = getEntity(id);
  if (!ent) {
    const err: ExodiaError = {
      code: "EX_NULL_REFERENCE",
      explanation: `Entity ${id} does not exist.`,
      fix: "//debug to list live entities.",
    };
    logError(`//destroy ${id}`, err);
    return { display: fmtError(err), kind: "error" };
  }
  removeEntity(id);
  dispatchScene({ type: "clear" });
  // re-emit remaining markers
  for (const e of listEntities()) {
    const d = getDef(e.type);
    if (d?.marker && e.lat != null && e.lng != null) {
      dispatchScene({
        type: "marker",
        lat: e.lat,
        lng: e.lng,
        label: `${d.marker.glyph} ${e.id}`,
        color: d.marker.color,
      });
    }
  }
  record(`destroy ${id}`);
  return {
    display: `◆ STATUS      SUCCESS\n  DESTROYED   ${id}`,
    kind: "success",
  };
}

function renderErrors(): string {
  const errs = listErrors().slice(0, 20);
  if (!errs.length) return "◆ no errors logged";
  return [
    "◆ RECENT ERRORS",
    ...errs.map(
      (e) =>
        `  ${new Date(e.at).toLocaleTimeString()} ${e.err.code} :: ${e.err.explanation}  «${e.input}»`,
    ),
  ].join("\n");
}

function renderDebug(): string {
  const ents = listEntities();
  const audit = listAudit().slice(0, 15);
  return [
    `◆ REGISTRY (${ents.length})`,
    ...ents.slice(0, 30).map(
      (e) =>
        `  ${e.id.padEnd(20)} ${e.type.padEnd(12)} ${e.descriptors.join(",") || "-"}  @ ${e.lat?.toFixed(2)},${e.lng?.toFixed(2)}`,
    ),
    `◆ AUDIT (last ${audit.length})`,
    ...audit.map((a) => `  ${new Date(a.at).toLocaleTimeString()} ${a.line}`),
  ].join("\n");
}

function renderAudit(): string {
  const evts = listGovAudit().slice(0, 30);
  if (!evts.length) return "◆ audit log empty";
  return [
    `◆ AUDIT LOG (last ${evts.length})`,
    ...evts.map(
      (e) =>
        `  ${new Date(e.at).toLocaleTimeString()} [${e.status.padEnd(5)}] ${e.action.padEnd(10)} ${e.target ?? ""}`,
    ),
  ].join("\n");
}


function descriptorEffects(d: string[]): string[] {
  const map: Record<string, string> = {
    frozen: "frost_breath,ice_particles",
    flaming: "fire_aura,ember_storm",
    robotic: "servo_hum,chrome_plates",
    abandoned: "dust_veil,silence",
    cyberpunk: "neon_haze,holo_signage",
    futuristic: "anti_grav,plasma_lights",
    corrupted: "glitch_field,signal_noise",
    ancient: "moss_overlay,relic_glow",
  };
  return d.flatMap((x) => (map[x] ? map[x].split(",") : []));
}

const randLat = () => (Math.random() * 140 - 70);
const randLng = () => (Math.random() * 360 - 180);
