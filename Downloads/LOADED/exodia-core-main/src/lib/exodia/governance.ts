import { audit_log } from "./registry";
import { audit } from "@/lib/governance/audit";

const recent: number[] = [];
const WINDOW_MS = 1000;
const MAX_PER_WINDOW = 10;

let strict = true;

export function isStrict() {
  return strict;
}

export function toggleStrict(): boolean {
  strict = !strict;
  audit_log(`governance.strict ⇒ ${strict}`);
  return strict;
}

export function rateLimitOk(): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0] > WINDOW_MS) recent.shift();
  if (recent.length >= MAX_PER_WINDOW) return false;
  recent.push(now);
  return true;
}

export function record(line: string) {
  audit_log(line);
  audit("exodia", { payload: { line } });
}
