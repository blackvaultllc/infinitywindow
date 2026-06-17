import { create } from "zustand";
import { DISASTERS, REGIONS, ROLE_ACTIONS } from "./data";
import type {
  ActionLogEntry,
  ActiveDisaster,
  AlertLevel,
  Alignment,
  ChatMessage,
  GameMode,
  HumanRole,
  Role,
} from "./types";
import { generateAiChat, aiTakeTurns } from "./ai";

interface GameState {
  started: boolean;
  playerRole: Role | null;
  mode: GameMode;
  clanBoost: boolean; // small advantage when queued with clanmates
  round: number;
  phase: "humans" | "earth" | "resolving";
  planetaryHealth: number;
  panic: number;
  alertLevel: AlertLevel;
  population: number; // millions, world
  trustScore: Record<HumanRole, number>;
  shieldActive: boolean;
  actionsRemaining: number;
  disasters: ActiveDisaster[];
  selectedDisasterId: string | null;
  actionsLog: ActionLogEntry[];
  chat: ChatMessage[];
  outcome: null | { winner: Role | "Humans" | "Hybrid"; summary: string };

  start: (role: Role, opts?: { mode?: GameMode; clanBoost?: boolean }) => void;
  reset: () => void;
  selectDisaster: (id: string | null) => void;
  performAction: (name: string, alignment: Alignment, targetRegion?: string) => void;
  endRound: () => void;
  endPhase: () => void;
  deployDisaster: (name: string, intensity: number, regionId: string) => void;
  abandonGame: () => void;
  pushChat: (m: Omit<ChatMessage, "id" | "ts">) => void;
}

const initialTrust = (): Record<HumanRole, number> => ({
  Diplomat: 70,
  Commander: 70,
  Scientist: 70,
  Engineer: 70,
});

let _id = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${++_id}`;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function chooseAlert(intensity: number, shieldActive: boolean): AlertLevel {
  let lvl: AlertLevel = 1;
  if (intensity >= 9) lvl = 4;
  else if (intensity >= 7) lvl = 3;
  else if (intensity >= 5) lvl = 2;
  else lvl = 1;
  if (shieldActive && lvl > 1) lvl = (lvl - 1) as AlertLevel;
  return lvl;
}

function rollDisaster(round: number, planetaryHealth: number, shieldActive: boolean): ActiveDisaster {
  // escalate pool as health drops
  const pool = DISASTERS.filter((d) => {
    if (planetaryHealth > 70) return d.baseIntensity <= 7;
    if (planetaryHealth > 40) return d.baseIntensity <= 9;
    return true;
  });
  const def = pool[Math.floor(Math.random() * pool.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const intensity = clamp(def.baseIntensity + Math.floor(Math.random() * 3) - 1, 1, 10);
  const alertLevel = chooseAlert(intensity, shieldActive);
  const popAffected = Math.round(region.population * (0.05 + intensity * 0.04) * 1_000_000);
  return {
    id: nid("dz"),
    name: def.name,
    category: def.category,
    region: region.id,
    intensity,
    alertLevel,
    structuralDamage: clamp(intensity * 7 + Math.random() * 10),
    infrastructureIntact: clamp(100 - intensity * 6 - Math.random() * 10),
    casualties: Math.round(popAffected * (0.001 + intensity * 0.0008)),
    populationAffected: popAffected,
    panic: clamp(intensity * 7),
    chainRisk: clamp(def.chain ? 25 + intensity * 5 : 5 + intensity * 2),
    chainPredicted: def.chain,
    resolved: false,
    bornAtRound: round,
  };
}

export const useGame = create<GameState>((set, get) => ({
  started: false,
  playerRole: null,
  mode: "ranked",
  clanBoost: false,
  round: 0,
  phase: "humans",
  planetaryHealth: 100,
  panic: 10,
  alertLevel: 1,
  population: 8000,
  trustScore: initialTrust(),
  shieldActive: false,
  actionsRemaining: 2,
  disasters: [],
  selectedDisasterId: null,
  actionsLog: [],
  chat: [],
  outcome: null,

  reset: () =>
    set({
      started: false,
      playerRole: null,
      mode: "ranked",
      clanBoost: false,
      round: 0,
      phase: "humans",
      planetaryHealth: 100,
      panic: 10,
      alertLevel: 1,
      population: 8000,
      trustScore: initialTrust(),
      shieldActive: false,
      actionsRemaining: 2,
      disasters: [],
      selectedDisasterId: null,
      actionsLog: [],
      chat: [],
      outcome: null,
    }),

  start: (role, opts) => {
    const mode: GameMode = opts?.mode ?? "ranked";
    const clanBoost = !!opts?.clanBoost;
    // Clan / coop perk: small head-start to humans (extra trust + shield primed)
    const perked = clanBoost || mode === "coop";
    set({
      started: true,
      playerRole: role,
      mode,
      clanBoost,
      round: 1,
      actionsRemaining: perked ? 3 : 2,
      shieldActive: perked && role !== "Terra",
      trustScore: perked
        ? { Diplomat: 80, Commander: 80, Scientist: 80, Engineer: 80 }
        : initialTrust(),
      phase: "humans",
    });
    const first = rollDisaster(1, 100, perked);
    set(() => ({
      disasters: [first],
      selectedDisasterId: first.id,
      alertLevel: first.alertLevel,
    }));
    get().pushChat({
      round: 1,
      role: "System",
      text: `[TERRA SYSTEM]: ${first.name} forming over ${REGIONS.find((r) => r.id === first.region)?.name}. Alert L${first.alertLevel}.${
        mode === "practice" ? " (Practice — record unaffected.)" : ""
      }${mode === "coop" ? " (Co-op vs Planet — clan perks active.)" : ""}${
        mode === "solo" ? " (Solo vs AI.)" : ""
      }`,
    });
    // initial AI chatter
    const messages = generateAiChat(get() as any);
    messages.forEach((m) => get().pushChat(m));
  },

  selectDisaster: (id) => set({ selectedDisasterId: id }),

  pushChat: (m) =>
    set((s) => ({
      chat: [
        ...s.chat,
        { ...m, id: nid("c"), ts: Date.now() },
      ].slice(-100),
    })),

  performAction: (name, alignment, targetRegion) => {
    const s = get();
    if (s.actionsRemaining <= 0 || !s.playerRole || s.outcome) return;
    const isTerra = s.playerRole === "Terra";
    if (isTerra && s.phase !== "earth") return;
    if (!isTerra && s.phase !== "humans") return;
    const dz =
      s.disasters.find((d) => d.id === s.selectedDisasterId && !d.resolved) ??
      s.disasters.find((d) => !d.resolved);
    if (!dz) return;

    const role = s.playerRole as HumanRole;
    let next = { ...dz };
    let planetDelta = 0;
    let panicDelta = 0;
    let result = "";
    let shieldActive = s.shieldActive;
    const trust = { ...s.trustScore };

    const lightBoost = alignment === "light" ? 1 : -1;

    switch (name) {
      case "Evacuate Population":
        next.casualties = Math.round(next.casualties * 0.6);
        next.populationAffected = Math.round(next.populationAffected * 0.7);
        panicDelta -= 8;
        result = `Casualties down 40% in ${next.region}.`;
        break;
      case "Negotiate Aid":
        next.infrastructureIntact = clamp(next.infrastructureIntact + 15);
        panicDelta -= 12;
        planetDelta += 3;
        result = "UN aid mobilized — infrastructure recovering.";
        break;
      case "Control Media":
        panicDelta -= 20;
        result = "Panic narrative contained.";
        break;
      case "Broker Ceasefire":
        next.chainRisk = clamp(next.chainRisk - 25);
        result = "Regional ceasefire — escalation slowed.";
        break;
      case "Deploy Rescue Ops":
        next.casualties = Math.round(next.casualties * 0.65);
        result = "Rescue ops cut casualties 35%.";
        break;
      case "Enforce Evacuation":
        next.casualties = Math.round(next.casualties * 0.7);
        panicDelta -= 10;
        result = "Perimeter held.";
        break;
      case "Asset Shielding":
        next.structuralDamage = clamp(next.structuralDamage - 18);
        result = "Military shielding deployed.";
        break;
      case "Establish Order":
        next.chainRisk = clamp(next.chainRisk - 15);
        panicDelta -= 8;
        result = "Order restored; damage capped.";
        break;
      case "Predict Chain Event":
        next.chainRisk = clamp(next.chainRisk - 10);
        result = `Prediction locked: ${next.chainPredicted ?? "no follow-up"}.`;
        break;
      case "Deploy Countermeasure":
        next.intensity = clamp(next.intensity - 2, 1, 10);
        next.structuralDamage = clamp(next.structuralDamage - 12);
        result = "Countermeasure dropped intensity by 2.";
        break;
      case "Model Storm Path":
        next.structuralDamage = clamp(next.structuralDamage - 20);
        result = "Path modeling rerouted assets.";
        break;
      case "Atmospheric Engineering":
        next.intensity = clamp(next.intensity - 3, 1, 10);
        planetDelta += 4;
        result = "Atmospheric pressure stabilized.";
        break;
      case "Activate Shields":
        shieldActive = true;
        next.intensity = clamp(next.intensity - 1, 1, 10);
        planetDelta += 2;
        result = "Planetary shields online.";
        break;
      case "Repair Infrastructure":
        next.infrastructureIntact = clamp(next.infrastructureIntact + 25);
        result = "Infrastructure +25%.";
        break;
      case "Resilient Build":
        planetDelta += 2;
        result = "Region hardened for next event.";
        break;
      case "Energy Absorption":
        next.intensity = clamp(next.intensity - 2, 1, 10);
        next.structuralDamage = clamp(next.structuralDamage - 10);
        result = "Energy bled from event core.";
        break;
      // Shadow actions
      case "Suppress Warnings":
      case "Delay Warning":
        next.casualties = Math.round(next.casualties * 1.3);
        panicDelta += 6;
        trust[role] = clamp(trust[role] - 12);
        result = "Warnings delayed. Trust falling.";
        break;
      case "Weaponize Panic":
        panicDelta += 20;
        trust[role] = clamp(trust[role] - 15);
        result = "Panic weaponized — leverage gained.";
        break;
      case "Block Aid":
        next.infrastructureIntact = clamp(next.infrastructureIntact - 10);
        trust[role] = clamp(trust[role] - 10);
        result = "Aid blocked.";
        break;
      case "Strike Under Cover":
      case "Abandon Region":
        next.casualties = Math.round(next.casualties * 1.4);
        trust[role] = clamp(trust[role] - 18);
        result = "Opportunistic move. Trust gutted.";
        break;
      case "Hoard Resources":
        trust[role] = clamp(trust[role] - 8);
        result = "Stockpiles secured.";
        break;
      case "Falsify Data":
      case "Sell Intel":
        next.chainRisk = clamp(next.chainRisk + 12);
        trust[role] = clamp(trust[role] - 14);
        result = "Data corrupted.";
        break;
      case "Sabotage Shields":
        shieldActive = false;
        next.intensity = clamp(next.intensity + 1, 1, 10);
        trust[role] = clamp(trust[role] - 16);
        result = "Shields offline.";
        break;
      case "Overcharge Crisis":
      case "Build to Fail":
        trust[role] = clamp(trust[role] - 10);
        next.infrastructureIntact = clamp(next.infrastructureIntact - 8);
        result = "Leverage extracted.";
        break;
      // Terra plays
      case "Escalate Event":
        next.intensity = clamp(next.intensity + 2, 1, 10);
        next.structuralDamage = clamp(next.structuralDamage + 12);
        planetDelta -= 6;
        result = "Event intensifying.";
        break;
      case "Trigger Chain":
        next.chainRisk = clamp(next.chainRisk + 30);
        result = "Chain pressure building.";
        break;
      case "New Disaster":
        // handled below via separate path
        result = "New crisis born.";
        break;
    }

    // recompute alert
    next.alertLevel = chooseAlert(next.intensity, shieldActive);

    const disasters = s.disasters.map((d) => (d.id === next.id ? next : d));
    if (name === "New Disaster") {
      disasters.push(rollDisaster(s.round, s.planetaryHealth, shieldActive));
    }

    set({
      disasters,
      shieldActive,
      trustScore: trust,
      panic: clamp(s.panic + panicDelta + lightBoost * -1),
      planetaryHealth: clamp(s.planetaryHealth + planetDelta),
      actionsRemaining: s.actionsRemaining - 1,
      actionsLog: [
        ...s.actionsLog,
        { round: s.round, role: s.playerRole!, alignment, name, target: targetRegion ?? next.region, result },
      ],
      alertLevel: Math.max(s.alertLevel, next.alertLevel) as AlertLevel,
    });

    get().pushChat({
      round: s.round,
      role: s.playerRole!,
      text: `[${s.playerRole?.toUpperCase()}]: ${name} executed — ${result}`,
    });
  },

  endRound: () => {
    get().endPhase();
  },

  endPhase: () => {
    const s = get();
    if (s.outcome) return;
    if (s.phase === "resolving") return;
    const isTerra = s.playerRole === "Terra";

    // HUMANS PHASE → battle resolves human plays → Earth phase begins.
    if (s.phase === "humans") {
      const aiActions = aiTakeTurns(s as any);
      aiActions.forEach((a) => get().pushChat(a));
      set({ phase: "resolving" });
      get().pushChat({
        round: s.round,
        role: "System",
        text: "[BATTLE]: Human plays resolve. Earth prepares its response…",
      });
      setTimeout(() => {
        set({ phase: "earth", actionsRemaining: 2 });
        get().pushChat({
          round: get().round,
          role: "System",
          text: "[PHASE]: Earth's turn — the planet strikes back.",
        });
        // AI plays Earth automatically for human players
        if (!isTerra) {
          setTimeout(() => {
            const cur = get();
            const live = cur.disasters.filter((d) => !d.resolved);
            if (live.length && Math.random() < 0.65) {
              const target = live[Math.floor(Math.random() * live.length)];
              const updated = cur.disasters.map((d) =>
                d.id !== target.id
                  ? d
                  : { ...d, intensity: clamp(d.intensity + 2, 1, 10), structuralDamage: clamp(d.structuralDamage + 12) },
              );
              set({ disasters: updated, planetaryHealth: clamp(cur.planetaryHealth - 6) });
              get().pushChat({
                round: cur.round,
                role: "Terra",
                text: `[TERRA]: Escalating ${target.name} over ${REGIONS.find((r) => r.id === target.region)?.name}.`,
              });
            } else {
              const fresh = rollDisaster(cur.round, cur.planetaryHealth, cur.shieldActive);
              set({
                disasters: [...cur.disasters, fresh],
                selectedDisasterId: fresh.id,
                alertLevel: Math.max(cur.alertLevel, fresh.alertLevel) as AlertLevel,
              });
              get().pushChat({
                round: cur.round,
                role: "Terra",
                text: `[TERRA]: ${fresh.name} unleashed over ${REGIONS.find((r) => r.id === fresh.region)?.name}.`,
              });
            }
            setTimeout(() => get().endPhase(), 1400);
          }, 900);
        }
      }, 1100);
      return;
    }

    // EARTH PHASE → resolve disasters, advance round, return to HUMANS.
    set({ phase: "resolving" });
    get().pushChat({
      round: s.round,
      role: "System",
      text: "[BATTLE]: Earth's strikes resolving…",
    });
    setTimeout(() => _advanceRound(get, set), 900);
  },

  deployDisaster: (name, intensity, regionId) => {
    const s = get();
    if (s.actionsRemaining <= 0 || s.outcome) return;
    if (s.phase !== "earth") return;
    const def = DISASTERS.find((d) => d.name === name);
    if (!def) return;
    const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
    const it = clamp(intensity, 1, 10);
    const alertLevel = chooseAlert(it, s.shieldActive);
    const popAffected = Math.round(region.population * (0.05 + it * 0.04) * 1_000_000);
    const dz: ActiveDisaster = {
      id: nid("dz"),
      name: def.name,
      category: def.category,
      region: region.id,
      intensity: it,
      alertLevel,
      structuralDamage: clamp(it * 7 + Math.random() * 10),
      infrastructureIntact: clamp(100 - it * 6 - Math.random() * 10),
      casualties: Math.round(popAffected * (0.001 + it * 0.0008)),
      populationAffected: popAffected,
      panic: clamp(it * 7),
      chainRisk: clamp(def.chain ? 25 + it * 5 : 5 + it * 2),
      chainPredicted: def.chain,
      resolved: false,
      bornAtRound: s.round,
    };
    set({
      disasters: [...s.disasters, dz],
      selectedDisasterId: dz.id,
      alertLevel: Math.max(s.alertLevel, alertLevel) as AlertLevel,
      planetaryHealth: clamp(s.planetaryHealth - Math.round(it * 1.5)),
      panic: clamp(s.panic + it * 2),
      actionsRemaining: s.actionsRemaining - 1,
      actionsLog: [
        ...s.actionsLog,
        { round: s.round, role: "Terra", alignment: "shadow", name: `Deploy ${def.name}`, target: region.id, result: `Intensity ${it} over ${region.name}.` },
      ],
    });
    get().pushChat({
      round: s.round,
      role: "Terra",
      text: `[TERRA]: ${def.name} unleashed over ${region.name} at intensity ${it}. Alert L${alertLevel}.`,
    });
  },

  abandonGame: () => {
    const s = get();
    if (!s.started || s.outcome) return;
    const role = s.playerRole ?? "player";
    const winner = s.playerRole === "Terra" ? "Humans" : "Terra";
    set({
      outcome: {
        winner,
        summary: `${role} forfeited the session. The opposing side receives the win.`,
      },
    });
    if (s.playerRole) {
      get().pushChat({
        round: s.round,
        role: "System",
        text: `[FORFEIT]: ${s.playerRole} left the match. ${winner} wins by default.`,
      });
    }
  },
}));

function _advanceRound(get: () => GameState, set: (p: Partial<GameState>) => void) {
    const s = get();
    let planetDelta = 0;
    const newDisasters: ActiveDisaster[] = [];
    const resolved = s.disasters.map((d) => {
      if (d.resolved) return d;
      const damage = Math.round((d.intensity / 10) * (d.alertLevel * 2) * (1 - d.infrastructureIntact / 200));
      planetDelta -= damage;
      // chain rolls
      if (d.chainPredicted && Math.random() * 100 < d.chainRisk) {
        const chainDef = DISASTERS.find((x) => x.name === d.chainPredicted);
        if (chainDef) {
          const region = REGIONS.find((r) => r.id === d.region) ?? REGIONS[0];
          newDisasters.push({
            id: nid("dz"),
            name: chainDef.name,
            category: chainDef.category,
            region: region.id,
            intensity: clamp(chainDef.baseIntensity, 1, 10),
            alertLevel: chooseAlert(chainDef.baseIntensity, s.shieldActive),
            structuralDamage: clamp(chainDef.baseIntensity * 6),
            infrastructureIntact: clamp(100 - chainDef.baseIntensity * 7),
            casualties: Math.round(region.population * 1_000_000 * 0.005 * chainDef.baseIntensity / 10),
            populationAffected: Math.round(region.population * 1_000_000 * 0.1),
            panic: clamp(chainDef.baseIntensity * 6),
            chainRisk: chainDef.chain ? 30 : 5,
            chainPredicted: chainDef.chain,
            resolved: false,
            bornAtRound: s.round + 1,
          });
        }
      }
      return { ...d, resolved: true };
    });

    // Terra always introduces a new event unless catastrophic count
    if (s.disasters.length < 6) {
      newDisasters.push(rollDisaster(s.round + 1, s.planetaryHealth + planetDelta, s.shieldActive));
    }

    const allDisasters = [...resolved, ...newDisasters];
    const newHealth = clamp(s.planetaryHealth + planetDelta);
    const newPanic = clamp(s.panic + (newDisasters.length * 4));
    const maxAlertNum = newDisasters.reduce<number>((m, d) => Math.max(m, d.alertLevel), 1);
    const maxAlert = (Math.min(5, Math.max(1, maxAlertNum)) as AlertLevel);

    // Outcome check
    let outcome: GameState["outcome"] = s.outcome;
    if (newHealth <= 0) {
      outcome = { winner: "Terra", summary: "Civilization has collapsed. Terra reclaims the surface." };
    } else if (s.round >= 10 && newHealth > 50) {
      outcome = { winner: "Humans", summary: `Survived 10 rounds with planetary health at ${newHealth}%.` };
    } else if (s.round >= 10) {
      outcome = { winner: "Hybrid", summary: `Planet stabilized at ${newHealth}% — but at a cost.` };
    }

    set({
      round: s.round + 1,
      actionsRemaining: 2,
      planetaryHealth: newHealth,
      panic: newPanic,
      disasters: allDisasters,
      selectedDisasterId: newDisasters[0]?.id ?? s.selectedDisasterId,
      alertLevel: maxAlert,
      outcome,
      phase: "humans",
    });

    if (!outcome) {
      const msgs = generateAiChat(get() as any);
      msgs.forEach((m) => get().pushChat(m));
      get().pushChat({
        round: get().round,
        role: "System",
        text: `[PHASE]: Round ${get().round} — humans, make your moves.`,
      });
    }
}