export type HumanRole = "Diplomat" | "Commander" | "Scientist" | "Engineer";
export type Role = HumanRole | "Terra";
export type Alignment = "light" | "shadow";
export type AlertLevel = 1 | 2 | 3 | 4 | 5;

// solo  = 1 human vs Terra AI (+ AI teammates fill other human seats)
// coop  = you + clanmates (AI stand-ins) vs Terra AI — "Humans vs Planet"
// practice = no ranked record, sandbox tuning, infinite restarts
// ranked = standard scored match (default)
export type GameMode = "solo" | "coop" | "practice" | "ranked";

export type DisasterCategory =
  | "Atmospheric"
  | "Geological"
  | "Hydrological"
  | "Fire"
  | "Cosmic"
  | "Biological"
  | "Electromagnetic"
  | "SlowBurn";

export interface DisasterDef {
  name: string;
  category: DisasterCategory;
  baseIntensity: number; // 1-10
  chain?: string; // name of follow-up event
}

export interface RegionDef {
  id: string;
  name: string;
  // Normalized 0..100 coords inside the map svg viewBox 0 0 100 60
  x: number;
  y: number;
  population: number; // millions
}

export interface ActiveDisaster {
  id: string;
  name: string;
  category: DisasterCategory;
  region: string; // region id
  intensity: number; // 1-10
  alertLevel: AlertLevel;
  structuralDamage: number; // %
  infrastructureIntact: number; // %
  casualties: number;
  populationAffected: number;
  panic: number; // 0-100
  chainRisk: number; // 0-100
  chainPredicted?: string;
  resolved: boolean;
  bornAtRound: number;
}

export interface ActionLogEntry {
  round: number;
  role: Role;
  alignment: Alignment;
  name: string;
  target?: string;
  result: string;
}

export interface ChatMessage {
  id: string;
  round: number;
  role: Role | "System";
  text: string;
  ts: number;
}