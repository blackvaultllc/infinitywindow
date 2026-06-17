import crypto from "crypto";

export type MedusaEventInput = {
  event_type: string;
  severity?: "alert" | "info" | "warning" | "critical" | string;
  player_ref?: string;
  message: string;
  payload?: Record<string, unknown>;
};

const HUB_URL = () => process.env.MEDUSA_HUB_URL;
const HUB_KEY = () => process.env.MEDUSA_HUB_KEY;

/**
 * Forward an event to the SIS LLC Medusa hub and log it to medusa_events.
 * Never throws — failures are logged in the row.
 */
export async function dispatchMedusaEvent(input: MedusaEventInput, sourceSite: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const body = {
    event_type: input.event_type,
    severity: input.severity ?? "info",
    player_ref: input.player_ref ?? sourceSite,
    message: input.message,
    payload: {
      ...(input.payload ?? {}),
      timestamp: new Date().toISOString(),
      source_site: sourceSite,
    },
  };

  let status = "skipped";
  let error: string | null = null;

  const hubUrl = HUB_URL();
  const hubKey = HUB_KEY();

  if (hubUrl && hubKey) {
    try {
      const res = await fetch(hubUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Medusa-Key": hubKey,
        },
        body: JSON.stringify(body),
      });
      status = res.ok ? `sent_${res.status}` : `failed_${res.status}`;
      if (!res.ok) error = (await res.text()).slice(0, 500);
    } catch (e) {
      status = "exception";
      error = e instanceof Error ? e.message : String(e);
    }
  } else {
    error = "MEDUSA_HUB_URL or MEDUSA_HUB_KEY not configured";
  }

  await supabaseAdmin.from("medusa_events").insert({
    direction: "outbound",
    event_type: body.event_type,
    severity: body.severity,
    player_ref: body.player_ref,
    message: body.message,
    payload: body,
    status,
    error,
  });

  return { status, error };
}

export function verifyIngestKey(provided: string | null): boolean {
  const expected = process.env.MEDUSA_INGEST_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}