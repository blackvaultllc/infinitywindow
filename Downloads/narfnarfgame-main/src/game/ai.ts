import type { ChatMessage, HumanRole } from "./types";
import { REGIONS } from "./data";

interface StateLike {
  round: number;
  playerRole: HumanRole | "Terra" | null;
  alertLevel: number;
  planetaryHealth: number;
  panic: number;
  disasters: any[];
  trustScore: Record<HumanRole, number>;
}

const ALL: HumanRole[] = ["Diplomat", "Commander", "Scientist", "Engineer"];

function regionName(id: string) {
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

function lineFor(role: HumanRole, s: StateLike): string {
  const dz = s.disasters.find((d) => !d.resolved) ?? s.disasters[0];
  if (!dz) return `[${role.toUpperCase()}]: Standing by. No active events. — Awaiting orders.`;
  const shadow = s.trustScore[role] < 40;
  const where = regionName(dz.region);
  const lvl = dz.alertLevel;
  if (role === "Diplomat") {
    return shadow
      ? `[DIPLOMAT]: Panic at ${s.panic}% over ${where}. I'd recommend we reconsider the aid routing... — Hold off on the public statement.`
      : `[DIPLOMAT]: ${dz.name} in ${where} at L${lvl}, panic ${s.panic}%. Casualties ${dz.casualties.toLocaleString()}. — Issue an evacuation order.`;
  }
  if (role === "Commander") {
    return shadow
      ? `[COMMANDER]: Assets thin in ${where}. We could redeploy elsewhere... — Pulling units back.`
      : `[COMMANDER]: ${dz.name} L${lvl} active in ${where}. Infrastructure ${Math.round(dz.infrastructureIntact)}%. — Deploy rescue ops now.`;
  }
  if (role === "Scientist") {
    return shadow
      ? `[SCIENTIST]: Models inconclusive on ${dz.name}. Possibly nothing. — Suggest we wait for more data.`
      : `[SCIENTIST]: ${dz.name} intensity ${dz.intensity}/10. Chain risk ${dz.chainRisk}% → ${dz.chainPredicted ?? "none"}. — Deploy countermeasure.`;
  }
  return shadow
    ? `[ENGINEER]: Shield systems are... straining. — Recommend deferring activation.`
    : `[ENGINEER]: Structural damage ${Math.round(dz.structuralDamage)}% in ${where}. — Activate shields and prep repair crews.`;
}

export function generateAiChat(s: StateLike): Omit<ChatMessage, "id" | "ts">[] {
  const aiRoles = ALL.filter((r) => r !== s.playerRole);
  const count = s.alertLevel >= 3 ? aiRoles.length : Math.min(2, aiRoles.length);
  const speakers = [...aiRoles].sort(() => Math.random() - 0.5).slice(0, count);
  return speakers.map((r) => ({ round: s.round, role: r, text: lineFor(r, s) }));
}

// AI roles act on round end — they don't mutate game state directly here,
// they just narrate their auto-actions. Mechanical effects are applied
// indirectly via the chain/escalation systems for v1.
export function aiTakeTurns(s: StateLike): Omit<ChatMessage, "id" | "ts">[] {
  const aiRoles = ALL.filter((r) => r !== s.playerRole);
  return aiRoles.map((r) => ({
    round: s.round,
    role: r,
    text: lineFor(r, s),
  }));
}