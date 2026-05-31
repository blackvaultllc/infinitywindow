import type { ExodiaError } from "./error-engine";

export type LiveEntity = {
  id: string;
  type: string;
  descriptors: string[];
  lat?: number;
  lng?: number;
  meta?: Record<string, unknown>;
  createdAt: number;
};

type Listener = () => void;

const counters: Record<string, number> = {};
const entities = new Map<string, LiveEntity>();
const errors: { at: number; err: ExodiaError; input: string }[] = [];
const audit: { at: number; line: string }[] = [];
const listeners = new Set<Listener>();
const MAX_ENTITIES = 200;
const MAX_ERRORS = 50;
const MAX_AUDIT = 200;

export function nextId(type: string): string {
  counters[type] = (counters[type] ?? 0) + 1;
  return `${type.toUpperCase()}_${String(counters[type]).padStart(3, "0")}`;
}

export function canSpawn(): boolean {
  return entities.size < MAX_ENTITIES;
}

export function addEntity(e: LiveEntity) {
  entities.set(e.id, e);
  emit();
}

export function removeEntity(id: string): boolean {
  const ok = entities.delete(id);
  if (ok) emit();
  return ok;
}

export function getEntity(id: string): LiveEntity | undefined {
  return entities.get(id);
}

export function listEntities(): LiveEntity[] {
  return Array.from(entities.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function logError(input: string, err: ExodiaError) {
  errors.unshift({ at: Date.now(), err, input });
  if (errors.length > MAX_ERRORS) errors.length = MAX_ERRORS;
  emit();
}

export function listErrors() {
  return errors.slice();
}

export function audit_log(line: string) {
  audit.unshift({ at: Date.now(), line });
  if (audit.length > MAX_AUDIT) audit.length = MAX_AUDIT;
}

export function listAudit() {
  return audit.slice();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((l) => l());
}
