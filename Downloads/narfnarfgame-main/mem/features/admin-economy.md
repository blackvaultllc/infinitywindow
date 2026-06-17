---
name: Admin & economy backend
description: Roles, owner email auto-promotion, profile economy guard, coin ledger, tickets, audit log, quests, codex.
type: feature
---
Owner: blackhatterxvi@gmail.com — auto-promoted to `admin` on signup via `handle_new_user`.
Roles: app_role enum (admin, moderator, support, player). Roles checked via `public.has_role(uid, role)` SECURITY DEFINER. Never put role on profiles.
Profiles: coins/bonus_multiplier/banned writable ONLY by admins (enforced by `guard_profile_economy` trigger). `prologue_choice` set once, then `alignment_locked=true` blocks change for non-admins.
Starter grant: every new signup gets 1000 coins + a `coin_ledger` row reason=`starter_grant` + `player_quests` row for `first-siren`.
Quests RPC: `complete_quest(slug)` — atomic, pays coins via ledger, unlocks reward codex. `unlock_codex(slug)` for story-driven unlocks.
Admin UI: `/admin` route (gated to admin/mod/support). Tabs: Users, Tickets, Ledger, Audit, Analytics. Coin/role/ban actions admin-only client-side AND server-side (RLS).
Codex UI: `/codex` shows unlocked entries per player.
Cutscene primitive: `<Cutscene beats={[...]} onDone={...}/>` in `src/components/Cutscene.tsx`.