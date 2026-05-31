// EXODIA Governance — Audit Bus
// In-memory append-only event log with pub/sub + optional Supabase persistence.
import { supabase } from "@/integrations/supabase/client";

export type AuditEvent = {
  id: string;
  at: number;
  action: string;
  target?: string;
  status: "ok" | "error" | "info";
  payload?: Record<string, unknown>;
};

type Listener = (events: AuditEvent[]) => void;

const events: AuditEvent[] = [];
const listeners = new Set<Listener>();
const MAX = 500;

export function audit(
  action: string,
  opts: { target?: string; status?: AuditEvent["status"]; payload?: Record<string, unknown> } = {},
) {
  const e: AuditEvent = {
    id: crypto.randomUUID(),
    at: Date.now(),
    action,
    target: opts.target,
    status: opts.status ?? "ok",
    payload: opts.payload,
  };
  events.unshift(e);
  if (events.length > MAX) events.length = MAX;
  listeners.forEach((l) => l(events));

  // Fire-and-forget persistence (RLS enforces ownership).
  void persist(e);
  return e;
}

async function persist(e: AuditEvent) {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await supabase.from("audit_events").insert({
      user_id: uid,
      action: e.action,
      target: e.target ?? null,
      status: e.status,
      payload: (e.payload ?? {}) as never,
    });
  } catch {
    /* ignore persistence errors — in-memory log is the source of truth in-session */
  }
}

export function listAudit(): AuditEvent[] {
  return events.slice();
}

export function subscribeAudit(fn: Listener): () => void {
  listeners.add(fn);
  fn(events);
  return () => {
    listeners.delete(fn);
  };
}
