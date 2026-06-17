import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// TERRA Frequency Comms — multi-user realtime via Supabase Broadcast.
// No auth or DB writes required. Anyone tuned to the same frequency
// joins the same channel and exchanges chat + ability ops events live.
// ─────────────────────────────────────────────────────────────────────────────

export const FREQUENCIES = [
  121.5, 137.0, 156.8, 162.4, 243.0, 282.8, 406.0, 433.9, 462.6,
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// 162.4 MHz is reserved as the OWNER's private family channel
// (Domenick & his daughter). The UI labels it with a crown so anyone
// tuning in knows they're on the owner's frequency of power.
export const OWNER_FREQUENCY = 162.4 as const;

export type CommsSender = {
  callsign: string;
  role: "Terra" | "Commander" | "Diplomat" | "Scientist" | "Engineer" | "Observer";
};

export type CommsChatPayload = {
  kind: "chat";
  id: string;
  sender: CommsSender;
  text: string;
  ts: number;
};

export type CommsAbilityPayload = {
  kind: "ability";
  id: string;
  sender: CommsSender;
  ability: string; // e.g. "Asteroid Impact"
  category: string;
  intensity: number;
  targetRegion: string;
  targetRegionName: string;
  ts: number;
  // optional inbound vector for trajectory animation (% units 0-100)
  vector?: { fromX: number; fromY: number; toX: number; toY: number };
};

export type CommsPayload = CommsChatPayload | CommsAbilityPayload;

const channelKey = (freq: number) => `terra:freq:${freq.toFixed(1)}`;
// Single always-on ops channel for ability broadcasts — every commander
// receives Terra's deploys regardless of which frequency they're tuned to.
const OPS_CHANNEL = "terra:ops:global";

export function getStoredIdentity(): { callsign: string; frequency: number } {
  if (typeof window === "undefined") return { callsign: "OBS-000", frequency: FREQUENCIES[0] };
  const cs = localStorage.getItem("terra.callsign");
  const fq = Number(localStorage.getItem("terra.frequency"));
  return {
    callsign: cs || `OBS-${Math.floor(Math.random() * 900 + 100)}`,
    frequency: FREQUENCIES.includes(fq as Frequency) ? fq : FREQUENCIES[0],
  };
}

export function setStoredIdentity(callsign: string, frequency: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("terra.callsign", callsign);
  localStorage.setItem("terra.frequency", String(frequency));
}

export function joinFrequencyChannel(
  frequency: number,
  onMessage: (payload: CommsPayload) => void,
): RealtimeChannel {
  const channel = supabase.channel(channelKey(frequency), {
    config: { broadcast: { self: true, ack: false } },
  });
  channel
    .on("broadcast", { event: "msg" }, ({ payload }) => onMessage(payload as CommsPayload))
    .subscribe();
  return channel;
}

export function joinOpsChannel(
  onAbility: (payload: CommsAbilityPayload) => void,
): RealtimeChannel {
  const channel = supabase.channel(OPS_CHANNEL, {
    config: { broadcast: { self: false, ack: false } },
  });
  channel
    .on("broadcast", { event: "ability" }, ({ payload }) => onAbility(payload as CommsAbilityPayload))
    .subscribe();
  return channel;
}

export async function sendChat(channel: RealtimeChannel, payload: CommsChatPayload) {
  await channel.send({ type: "broadcast", event: "msg", payload });
}

export async function broadcastAbility(payload: CommsAbilityPayload) {
  // fire-and-forget on a transient ops channel
  const ch = supabase.channel(OPS_CHANNEL);
  await new Promise<void>((resolve) => {
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
    setTimeout(resolve, 800);
  });
  await ch.send({ type: "broadcast", event: "ability", payload });
  setTimeout(() => {
    void supabase.removeChannel(ch);
  }, 1500);
}

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}