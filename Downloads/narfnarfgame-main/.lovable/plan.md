# Build Plan — 3 Phases

I'll build each phase as its own migration + server functions + UI. Each phase ends with a working, testable feature before the next starts.

---

## Phase 1 — Clan Hierarchy & Recruitment

**Database**
- New enum `clan_role`: `owner`, `co_leader`, `elder`, `member`
- Add `clans.recruitment` (`open` | `closed` | `invite_only`, default `closed`)
- Migrate `clan_members.role` to the new enum
- Server functions (RLS-safe):
  - `set_clan_recruitment(clan_id, mode)` — owner only
  - `promote_member(clan_id, user_id, role)` — owner can set any rank below owner; co_leader can promote up to elder
  - `kick_member(clan_id, user_id)` — owner/co_leader, cannot kick higher or equal rank
  - `transfer_ownership(clan_id, new_owner_id)` — owner only
  - `join_clan(clan_id)` — succeeds only if recruitment = `open`
  - `request_join_clan` / `accept_join_request` — for `invite_only`
- New table `clan_join_requests` for invite-only flow

**UI**
- Clan page: rank badges (crown / shield / star / dot), kick + promote buttons gated by viewer rank
- Owner-only "Recruitment" toggle (Open / Invite Only / Closed)
- Pending join requests list for officers

---

## Phase 2 — 4v4 Arena (Planet vs Humans)

**Database**
- `arena_matches`: status (`lobby`, `active`, `complete`), planet_score, humans_score, winner, started_at, ended_at
- `arena_match_players`: match_id, user_id, team (`planet` | `humans`), country, slot (1-4), is_ready
- `arena_actions`: match_id, user_id, turn, ability_slug, damage, target_team — turn log
- `profiles.victory_points` column (int, default 0)
- Server functions:
  - `arena_quickmatch()` — finds or creates a lobby with an open slot, auto-balances teams
  - `arena_set_ready(match_id)`
  - `arena_start_match(match_id)` — fires when 8 ready
  - `arena_play_ability(match_id, ability_slug, target)` — validates turn, updates score, broadcasts via realtime
  - `arena_resolve(match_id)` — awards VP to winning team
- Realtime channel on `arena_matches` + `arena_actions` for live scoreboard

**UI**
- `/arena` route: "Find Match" + "Play vs AI"
- Lobby screen: 4 slots per side, country flags, ready check, waiting indicator
- Match screen: scoreboard (Planet ████ vs Humans ████), turn indicator, ability picker, action feed
- Victory screen with VP awarded
- Hook into existing PvP entry so the Play button routes here

---

## Phase 3 — Moderated Chat + Audit

**Database**
- Add roles to enum: `moderator`, `support`
- `chat_messages.is_hidden`, `hidden_by`, `hidden_reason`, `flagged` columns
- `chat_reports`: reporter_id, message_id, reason, status, reviewed_by, reviewed_at
- `moderation_actions`: actor_id, action (`hide_message`, `ban_user`, `mute_user`, `unban`, etc.), target_user_id, target_message_id, reason, metadata
- `user_mutes`: user_id, muted_until, reason
- Profanity / grooming wordlist table `chat_filter_terms` (severity 1-3)
- Server functions:
  - `send_chat_message` — runs server-side filter; severity 3 auto-hides + flags + auto-mute
  - `report_message(message_id, reason)`
  - `hide_message(message_id, reason)` — mod+
  - `mute_user(user_id, minutes, reason)` — mod+
  - `ban_user(user_id, reason)` — admin only
  - All actions write to `moderation_actions`

**UI**
- Chat: hidden messages collapsed with "Removed by moderator" stub; Report button on each message
- `/mod` dashboard (mod+ only): pending reports, recent hidden messages, user lookup, ban/mute controls, full audit log table with filters

---

## Technical Notes

- All clan/arena/chat mutations go through `createServerFn` with `requireSupabaseAuth` — RLS stays read-mostly, mutations validated server-side
- Realtime used for arena scoreboard + chat (existing pattern)
- Roles checked with `has_role()` security-definer function (already exists)
- All new public tables get `GRANT` + RLS in the same migration

---

## Execution Order

Each phase = 1 migration + ~3-6 file edits. I'll ship Phase 1 first, you test it, then I move to Phase 2, etc. If you'd rather I just power through all three without pausing, say "go straight through."
