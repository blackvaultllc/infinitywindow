import { ACTIONS, DESCRIPTORS, entityExists } from "./semantic-db";
import type { ExodiaError } from "./error-engine";

export type ParsedPlan = {
  action: string;
  entity?: string;
  descriptors: string[];
  name?: string;
  lat?: number;
  lng?: number;
  category?: number;
  targetId?: string;
  rawTokens: string[];
};

export type ParseResult =
  | { ok: true; plan: ParsedPlan; trace: string[] }
  | { ok: false; error: ExodiaError; trace: string[] };

const LAT = /^-?\d{1,2}(\.\d+)?$/;
const LNG = /^-?\d{1,3}(\.\d+)?$/;

export function tokenize(input: string): string[] {
  return input
    .trim()
    .replace(/^\/\//, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function parse(input: string): ParseResult {
  const trace: string[] = [];
  const tokens = tokenize(input);
  trace.push(`tokenize → [${tokens.join(", ")}]`);

  if (!tokens.length) {
    return {
      ok: false,
      trace,
      error: {
        code: "EX_INVALID_SYNTAX",
        explanation: "Empty command.",
        fix: "//help",
      },
    };
  }

  const action = tokens[0].toLowerCase();
  trace.push(`action → ${action}`);
  if (!ACTIONS.has(action)) {
    return {
      ok: false,
      trace,
      error: {
        code: "EX_UNKNOWN_COMMAND",
        explanation: `Unknown action "${action}".`,
        fix: "//help",
      },
    };
  }

  const plan: ParsedPlan = {
    action,
    descriptors: [],
    rawTokens: tokens,
  };

  // Meta commands — no further parsing required.
  if (["help", "errors", "debug", "governance", "audit"].includes(action)) {
    return { ok: true, plan, trace };
  }

  // destroy <ENTITY_ID>
  if (action === "destroy") {
    if (!tokens[1]) {
      return {
        ok: false,
        trace,
        error: {
          code: "EX_MISSING_PARAMETER",
          explanation: "destroy requires an ENTITY_ID.",
          fix: "//destroy DRAGON_001",
        },
      };
    }
    plan.targetId = tokens[1].toUpperCase();
    trace.push(`target → ${plan.targetId}`);
    return { ok: true, plan, trace };
  }

  // weather <kind> category<n> [lat lng]
  if (action === "weather") {
    const kind = tokens[1]?.toLowerCase();
    if (!kind) {
      return {
        ok: false,
        trace,
        error: {
          code: "EX_MISSING_PARAMETER",
          explanation: "weather requires a kind (storm | tornado | hurricane).",
          fix: "//weather storm category3",
        },
      };
    }
    if (!entityExists(kind)) {
      return {
        ok: false,
        trace,
        error: {
          code: "EX_UNKNOWN_ENTITY",
          explanation: `Weather "${kind}" not in semantic database.`,
          fix: "Try: storm, tornado, hurricane",
        },
      };
    }
    plan.entity = kind;
    const catTok = tokens.slice(2).find((t) => /^category\d+$/i.test(t));
    if (!catTok) {
      return {
        ok: false,
        trace,
        error: {
          code: "EX_MISSING_PARAMETER",
          explanation: "weather requires categoryN (1-5).",
          fix: `//weather ${kind} category3`,
        },
      };
    }
    plan.category = Number(catTok.replace(/category/i, ""));
    trace.push(`category → ${plan.category}`);
    parseLatLng(tokens, plan, trace);
    return { ok: true, plan, trace };
  }

  // spawn|create|generate|simulate|modify <entity> [descriptors...] [name] [lat lng]
  const entityTok = tokens[1]?.toLowerCase();
  if (!entityTok) {
    return {
      ok: false,
      trace,
      error: {
        code: "EX_MISSING_PARAMETER",
        explanation: `${action} requires an entity type.`,
        fix: `//${action} dragon`,
      },
    };
  }
  if (!entityExists(entityTok)) {
    return {
      ok: false,
      trace,
      error: {
        code: "EX_UNKNOWN_ENTITY",
        explanation: `Entity "${entityTok}" not in semantic database.`,
        fix: "Register entity first or check spelling.",
      },
    };
  }
  plan.entity = entityTok;

  // remaining tokens: descriptors + optional name + optional lat lng
  const rest = tokens.slice(2);
  const nameParts: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    const low = t.toLowerCase();
    if (DESCRIPTORS.has(low)) {
      plan.descriptors.push(low);
      continue;
    }
    // lat lng pair
    if (LAT.test(t) && rest[i + 1] && LNG.test(rest[i + 1])) {
      plan.lat = Number(t);
      plan.lng = Number(rest[i + 1]);
      i++;
      continue;
    }
    nameParts.push(t);
  }
  if (nameParts.length) plan.name = nameParts.join("_");
  trace.push(
    `descriptors → [${plan.descriptors.join(", ")}] name → ${plan.name ?? "-"} loc → ${plan.lat ?? "-"},${plan.lng ?? "-"}`,
  );

  return { ok: true, plan, trace };
}

function parseLatLng(tokens: string[], plan: ParsedPlan, trace: string[]) {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (LAT.test(tokens[i]) && LNG.test(tokens[i + 1])) {
      plan.lat = Number(tokens[i]);
      plan.lng = Number(tokens[i + 1]);
      trace.push(`loc → ${plan.lat},${plan.lng}`);
      return;
    }
  }
}
