---
name: Frequency comms system
description: Multi-user realtime chat between Terra and commanders + ability ops broadcasts
type: feature
---
Implementation:
- `src/lib/comms.ts` — Supabase Realtime broadcast helpers. Frequencies: 121.5, 137.0, 156.8, 162.4, 243.0, 282.8, 406.0, 433.9, 462.6 MHz.
- Tunable per-frequency channels: `terra:freq:<n>`. Each client subscribes to one frequency at a time.
- Always-on ops channel: `terra:ops:global`. Terra's `confirmDeploy` calls `broadcastAbility` with vector (fromX/Y → toX/Y in 100x60 viewBox units).
- Commanders render `InboundFeed` (text alerts) and `InboundTrajectoryLayer` (animated streak on WorldMap).
- Callsign + frequency persist in localStorage keys `terra.callsign`, `terra.frequency`.
- No auth or DB writes needed — broadcast channel is open. Switch to private channels if presence/auth needed later.