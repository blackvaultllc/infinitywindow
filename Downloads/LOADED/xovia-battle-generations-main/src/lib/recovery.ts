import { generateMnemonic, validateMnemonic } from "bip39";

// 24-word phrase (256-bit entropy). Standard BIP39 English wordlist.
export function generateRecoveryPhrase(): string {
  return generateMnemonic(256);
}

export function isValidRecoveryPhrase(phrase: string): boolean {
  const normalized = normalizePhrase(phrase);
  return validateMnemonic(normalized);
}

export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Hash a recovery phrase for server-side storage. We use SHA-256 with a fixed
 * salt suffix so the same phrase always produces the same hash but the raw
 * value is never reversible. The phrase has 256 bits of entropy on its own,
 * so a fast hash is acceptable — brute-forcing 2^256 is intractable.
 */
export async function hashRecoveryPhrase(phrase: string): Promise<string> {
  const normalized = normalizePhrase(phrase);
  const data = new TextEncoder().encode(`exodia-recovery-v1:${normalized}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}