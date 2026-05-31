# Heir account + card expansion

## 1. Provision Khadija (heir)

**Account**
- Email: `khadijahall0325x@gmail.com`
- Password: the previously generated "become the cup" credential (you'll re-paste it in the Owner Console field, not stored in code)
- DOB: 2019-03-25 (stored on profile, gates underage flows)
- Display name: `Khadija`

Implemented as a **Dashboard button** (Owner Console → "Set up Khadija's account"):
- Calls a `createServerFn` (`provisionHeir`) gated by `is_owner(auth.uid())`
- Server-side: `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`, then upsert profile (display_name, dob, is_minor=true), assign role `heir`, log to `mod_actions`
- Idempotent: if user already exists, just re-assert role + profile

## 2. New `heir` role (app_role enum)

- Migration adds `'heir'` to `app_role`
- New permissions granted to `heir` via `role_permissions`:
  - `audit.view`, `alerts.view`, `suspicion.review`, `reports.handle` (sees everything owner sees)
  - **NOT** granted: `roles.manage`, `posts.manage`, any toggle/economy mutation perms
- `is_owner()` stays owner-only. New helper `is_owner_or_heir()` for read surfaces
- Admin pages (`/admin`, `/owner`) gate **viewing** on `is_owner_or_heir`, **mutations** stay `is_owner`
- Owner-only cards (Psycronos, Khadija): heir CAN view/play (per memory: "admins inherit" — heir is stricter than admin but explicitly whitelisted on Khadija card)
- She can play arena/board/buy packs like any normal user (no extra gates needed)

## 3. Mirror owner pack pulls → heir

- Trigger `mirror_owner_pulls_to_heir` on `pack_purchases AFTER INSERT`:
  - If `NEW.user_id = owner_uid()` and heir exists, insert a parallel `pack_purchases` row for heir with the same `cards_received`
  - And upsert into `user_cards` for heir (quantity += 1 per card)
- Same trigger on `chest_open_log` (mirrors chest pulls)
- Heir's mirrored cards are flagged in `meta` so they don't double-count revenue / can't be re-listed for cash (still tradeable in-game)

Note: only mirrors **future** pulls. A separate one-shot "backfill heir" button on the Owner Console copies your current collection over on demand.

## 4. Add ~100 cards

- Generate 100 new entries in `card_catalog` + matching art via `imagegen` (fast tier, batched in parallel, ~6–8 at a time to stay under rate limits)
- Themes spread across Egyptian/cosmic motifs already used: scarabs, falcons, jackals, lotus, ankh variants, constellation guardians, desert spirits, river deities, scribe-mages
- Distributed across rarities matching existing weights (Common 50, Rare 30, Epic 15, Legendary 5)
- Files saved to `src/assets/cards/generated/{slug}.jpg`, registered in `src/data/cards.ts` and inserted into `card_catalog` so they show up in packs

## Technical notes
- `provisionHeir` lives at `src/lib/heir.functions.ts`
- Dashboard button: new section on `/admin` only visible to owner
- All heir powers enforced **server-side via RLS + has_permission**, not client checks
- Image generation: 100 calls is heavy. I'll do **30 cards** this pass (Common+Rare bulk), and queue follow-up batches if you want the full 100 — confirm in the message after approval and I'll keep grinding

## What I will NOT do
- Won't grant heir any write/toggle perms
- Won't store the password in code/db beyond Supabase Auth's own hash
- Won't mirror cash purchases (no double-charging revenue); only the card inventory mirrors