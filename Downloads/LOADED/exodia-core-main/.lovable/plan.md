# Plan: Remove Sovereign + Lock Khadija's Account

## 1. Splash cinematic — remove Sovereign Holdings entirely

- Edit `src/components/splash/SplashSequence.tsx`: delete Frame 2 (Sovereign scarab). New order: **Hall → Augie → Medusa → Moonlight Magic** (4 frames).
- Edit `src/components/splash/TriforceAssemble.tsx`: drop the Sovereign seal from the triforce. New layout: **Hall (top), Augie (bottom-left), Medusa (bottom-right or center)** — confirm placement below.
- Delete `src/assets/seals/sovereign.jpg` and remove its import.
- Update `mem://design/splash-hierarchy.md` and `mem://index.md` Core rules: Sovereign is no longer on the page. Remove the "Powered by / Affiliated with" rule since it no longer applies to the splash.

## 2. Khadija's account — president-locked guardianship

New protections (Phase 2 backend, not yet built — this plan locks the rules in):

- **President override**: only `serpentintelligencesystems@gmail.com` (Mr. Infinity) can view, edit, suspend, or delete Khadija's account. No moderator, executive, or admin role can touch it.
- **Identity flag**: add `is_protected_minor BOOLEAN` and `guardian_user_id UUID` columns to the profiles table. Khadija's profile sets `guardian_user_id` = president's user_id.
- **RLS**: every table that references `user_id` gets an additional policy — if the target row's `user_id` belongs to a protected minor, only the guardian (president) can SELECT/UPDATE/DELETE outside of the minor's own session.
- **Audit**: every access to a protected minor's account writes to `audit_events` (already exists) with action `protected_minor_access` so the president sees who tried.

## 3. Sandbox + friend invites (parent-approved)

- Khadija has a personal sandbox room. She can roam any public page freely.
- Inside her sandbox, she can generate an invite for a friend, but the invite enters `pending_guardian_approval` state.
- President sees pending invites at `/parent` (or `/president`) and must tap **Approve** before the friend's account can join.
- New table `friend_invites`: `id`, `inviter_user_id`, `invitee_email`, `status` (`pending_guardian` | `approved` | `denied` | `accepted`), `guardian_user_id`, `created_at`, `decided_at`.
- RLS: inviter can create + read own; guardian can read + update status; invitee can read once approved.

## 4. Augie AI — "smartest AI ever, free for Khadija forever"

- Augie is Khadija's personal AI, built on Lovable AI Gateway (no per-user API key cost to her).
- Default model tier: `google/gemini-2.5-pro` for reasoning + `google/gemini-2.5-flash-image` for image play. Server-side only — Khadija never sees keys, never pays.
- System prompt locks Augie to kid-safe behavior, refuses adult content, and treats president as ultimate authority.
- This is scaffolded in Phase 2; for now the plan locks the rule: **Khadija's AI usage is always routed through the president's Lovable AI Gateway, never billed to her, never rate-limited against her.**

## Phase 1 (build now)
Only step **1** (splash edits + memory update). Everything else is Phase 2 backend that needs the auth/roles system from the earlier plan.

## Confirm before I build
- **Triforce after Sovereign is removed**: Hall on top, Augie bottom-left, Medusa bottom-right — or Medusa in the center with Hall + Augie flanking? (You said earlier "Medusa on top of the pyramid, daughter angel in the middle" — want me to switch to Medusa-top, Augie-center, Hall bottom?)
- **Frame count**: 4 frames (Hall → Augie → Medusa → Moonlight) — correct?
