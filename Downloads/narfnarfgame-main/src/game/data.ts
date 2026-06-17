import type { DisasterDef, HumanRole, RegionDef } from "./types";

export const REGIONS: RegionDef[] = [
  { id: "na-west", name: "Pacific Northwest", x: 18, y: 20, population: 52 },
  { id: "na-gulf", name: "Gulf Coast", x: 27, y: 30, population: 28 },
  { id: "sa-amazon", name: "Amazon Basin", x: 35, y: 42, population: 34 },
  { id: "eu-west", name: "Western Europe", x: 50, y: 22, population: 196 },
  { id: "af-sahel", name: "Sahel Belt", x: 53, y: 36, population: 78 },
  { id: "me-gulf", name: "Persian Gulf", x: 60, y: 30, population: 64 },
  { id: "as-south", name: "South Asia", x: 68, y: 32, population: 1820 },
  { id: "as-east", name: "East Asia", x: 78, y: 26, population: 1610 },
  { id: "oc-aus", name: "Australasia", x: 82, y: 46, population: 41 },
  { id: "arc-north", name: "Arctic Shelf", x: 50, y: 8, population: 1 },
];

export const DISASTERS: DisasterDef[] = [
  { name: "Hurricane", category: "Atmospheric", baseIntensity: 7, chain: "Storm Surge" },
  { name: "Tornado Outbreak", category: "Atmospheric", baseIntensity: 5 },
  { name: "Heat Wave", category: "Atmospheric", baseIntensity: 4, chain: "Drought" },
  { name: "Polar Vortex", category: "Atmospheric", baseIntensity: 6 },
  { name: "Atmospheric River", category: "Atmospheric", baseIntensity: 6, chain: "Flash Flood" },
  { name: "Bomb Cyclone", category: "Atmospheric", baseIntensity: 7 },
  { name: "Derecho", category: "Atmospheric", baseIntensity: 5 },
  { name: "Dust Storm", category: "Atmospheric", baseIntensity: 4 },
  { name: "Earthquake", category: "Geological", baseIntensity: 8, chain: "Tsunami" },
  { name: "Volcanic Eruption", category: "Geological", baseIntensity: 8, chain: "Ash Cloud" },
  { name: "Landslide", category: "Geological", baseIntensity: 5 },
  { name: "Sinkhole Cluster", category: "Geological", baseIntensity: 4 },
  { name: "Liquefaction Event", category: "Geological", baseIntensity: 6 },
  { name: "Tsunami", category: "Hydrological", baseIntensity: 9, chain: "Coastal Flood" },
  { name: "Coastal Flood", category: "Hydrological", baseIntensity: 6, chain: "Disease Outbreak" },
  { name: "Flash Flood", category: "Hydrological", baseIntensity: 5 },
  { name: "Storm Surge", category: "Hydrological", baseIntensity: 6 },
  { name: "Glacial Outburst", category: "Hydrological", baseIntensity: 7 },
  { name: "Wildfire", category: "Fire", baseIntensity: 6, chain: "Air Quality Crisis" },
  { name: "Firestorm", category: "Fire", baseIntensity: 8 },
  { name: "Drought", category: "Atmospheric", baseIntensity: 5, chain: "Wildfire" },
  { name: "Ash Cloud", category: "Atmospheric", baseIntensity: 6, chain: "Global Cooling" },
  { name: "Global Cooling", category: "SlowBurn", baseIntensity: 7, chain: "Famine" },
  { name: "Famine", category: "Biological", baseIntensity: 7 },
  { name: "Air Quality Crisis", category: "Biological", baseIntensity: 5, chain: "Pandemic" },
  { name: "Disease Outbreak", category: "Biological", baseIntensity: 6, chain: "Pandemic" },
  { name: "Pandemic", category: "Biological", baseIntensity: 8 },
  { name: "Locust Swarm", category: "Biological", baseIntensity: 5 },
  { name: "Red Tide", category: "Biological", baseIntensity: 4 },
  { name: "Meteorite Impact", category: "Cosmic", baseIntensity: 7, chain: "Shockwave" },
  { name: "Asteroid Impact", category: "Cosmic", baseIntensity: 10, chain: "Megatsunami" },
  { name: "Shockwave", category: "Cosmic", baseIntensity: 7 },
  { name: "Megatsunami", category: "Hydrological", baseIntensity: 9, chain: "Nuclear Winter" },
  { name: "Nuclear Winter", category: "SlowBurn", baseIntensity: 10 },
  { name: "Solar Flare", category: "Cosmic", baseIntensity: 6, chain: "EMP Event" },
  { name: "Coronal Mass Ejection", category: "Cosmic", baseIntensity: 7, chain: "Geomagnetic Storm" },
  { name: "Geomagnetic Storm", category: "Electromagnetic", baseIntensity: 6 },
  { name: "EMP Event", category: "Electromagnetic", baseIntensity: 7, chain: "Civil Unrest" },
  { name: "Civil Unrest", category: "SlowBurn", baseIntensity: 5 },
  { name: "Pole Shift", category: "SlowBurn", baseIntensity: 9 },
  { name: "Supervolcano", category: "Geological", baseIntensity: 10, chain: "Global Cooling" },
  { name: "Ozone Depletion", category: "SlowBurn", baseIntensity: 7 },
  { name: "Methane Release", category: "SlowBurn", baseIntensity: 6 },
];

export const ROLE_ACTIONS: Record<
  HumanRole,
  { light: { name: string; desc: string }[]; shadow: { name: string; desc: string }[] }
> = {
  Diplomat: {
    light: [
      { name: "Evacuate Population", desc: "Mass evacuation reduces casualties by up to 40%." },
      { name: "Negotiate Aid", desc: "Mobilizes UN aid: lowers panic, restores infrastructure." },
      { name: "Control Media", desc: "Calm narrative reduces panic meter significantly." },
      { name: "Broker Ceasefire", desc: "Caps escalation speed by stabilizing conflict zones." },
    ],
    shadow: [
      { name: "Suppress Warnings", desc: "Delays alerts. Boosts personal leverage, raises casualties." },
      { name: "Weaponize Panic", desc: "Spikes panic to extract concessions." },
      { name: "Block Aid", desc: "Withholds relief from rival regions." },
    ],
  },
  Commander: {
    light: [
      { name: "Deploy Rescue Ops", desc: "Pulls survivors. Cuts casualties by 35%." },
      { name: "Enforce Evacuation", desc: "Hard perimeter — reduces panic and casualties." },
      { name: "Asset Shielding", desc: "Redirects military assets as physical shields." },
      { name: "Establish Order", desc: "Caps damage accrual at current alert level." },
    ],
    shadow: [
      { name: "Strike Under Cover", desc: "Use the disaster for opportunistic strikes." },
      { name: "Hoard Resources", desc: "Stockpile relief assets for later leverage." },
      { name: "Abandon Region", desc: "Pull out — casualties spike, you gain elsewhere." },
    ],
  },
  Scientist: {
    light: [
      { name: "Predict Chain Event", desc: "Reveals next chain event with high confidence." },
      { name: "Deploy Countermeasure", desc: "Reduces disaster intensity by 2." },
      { name: "Model Storm Path", desc: "Lowers infrastructure damage by 20%." },
      { name: "Atmospheric Engineering", desc: "Major intensity reduction at high cost." },
    ],
    shadow: [
      { name: "Falsify Data", desc: "Mislead other roles. Player trust degrades." },
      { name: "Delay Warning", desc: "Event enters at Level 3+." },
      { name: "Sell Intel", desc: "Trade prediction data for personal gain." },
    ],
  },
  Engineer: {
    light: [
      { name: "Activate Shields", desc: "Planetary shields reduce escalation by 30%." },
      { name: "Repair Infrastructure", desc: "Restores intact% by 25 in target region." },
      { name: "Resilient Build", desc: "Hardens region against next event." },
      { name: "Energy Absorption", desc: "Bleeds intensity from active event." },
    ],
    shadow: [
      { name: "Sabotage Shields", desc: "Disable defenses. Escalation accelerates." },
      { name: "Overcharge Crisis", desc: "Inflate repair costs for leverage." },
      { name: "Build to Fail", desc: "Future regions degrade faster." },
    ],
  },
};

export const ROLE_BLURB: Record<HumanRole, string> = {
  Diplomat: "Population, narrative, aid, alliances.",
  Commander: "Military assets, evacuation, ground response.",
  Scientist: "Prediction, research, countermeasures.",
  Engineer: "Shields, infrastructure, repair systems.",
};

export const ROLE_ICON: Record<HumanRole | "Terra", string> = {
  Diplomat: "◆",
  Commander: "▲",
  Scientist: "✦",
  Engineer: "⬡",
  Terra: "◉",
};