---
name: TERRA storyline (4 Acts)
description: Master 4-act narrative for TERRA: Planet vs Humans. Drives prologue beats and the /lore page. Includes progression gating and crosslink to infinitycomics.xyz.
type: feature
---
**Acts (in order):**
1. **THE BREAKING POINT** — TERRA (Earth's core intelligence) awakens; strategic disasters; survival mode. Always unlocked.
2. **THE WATCHERS** — M.I.B. (Mafia Interstellar Bureau of Investigations) revealed; Captain Infinity's sealed file. Unlocks after 1 completed match.
3. **THE TWIST** — Captain Infinity is TERRA's field general inside the M.I.B., steering disasters away from innocents, collapsing corrupt systems. Unlocks after 5 matches.
4. **THE RECKONING** — The whole game was a test; pick a side; crosslink to infinitycomics.xyz Issue One. Unlocks after 10 matches.

**Gating storage:** localStorage `narf.lore.matchesCompleted` (counter) and `narf.lore.maxAct` (1–4). Bumped in `src/routes/_authenticated/end.tsx` on outcome. Staff (admin/moderator/support) bypass gating on `/lore`.

**Prologue intro on first visit** shows all 4 acts as teasers; Act III is intentionally redacted ("[CLASSIFIED — CLEARANCE PENDING]") to preserve the twist. Full reveal lives on `/lore`.

**Lore delivery format flavors:** TERRA pulse broadcast (Act I), intercepted transmission fragment (Act II), decrypted M.I.B. field report clearance ω (Act III), final directive (Act IV).

**Crosslink:** All Act IV CTAs and a footer crosslink on `/lore` point to https://infinitycomics.xyz (Issue One, Grand Oracle Series).
