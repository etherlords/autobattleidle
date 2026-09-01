---
plannerFormat: 1
id: ABI-044
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-028
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-044 verification

## Acceptance evidence

- Production reproduction: encounter 36 previously dealt 1 damage for 310 manual hits; encounter 48
  hardened required 463 packets and encounter 57 armored required 420 packets.
- Corrected deterministic receipts: encounter 36/48/57 raw armor 15/18/20-or-less by current damage
  budget, representative final non-critical damage 19/23/19, and 17/21/17 logical hits.
- Shared ownership: only armor/hardened elite modifier armor is capped; boss armor/HP, Golden Bug,
  rewards, upgrades, ordinary HP targets, and save schema are unchanged.
- Persistence: exact former pre-cap V3/V4 armored and hardened enemies normalize to current capped
  spawns, retain proportional HP and all canonical progress, then save and reload.
- Time-based endgame: corrected exact 48-hour non-boss probe is 250,863; 49-hour encounter is 257,354;
  exact/event-jump state equality remains covered.
- Project gate: `pnpm check` exit 0, 20 files / 196 tests, worker TypeScript and production build pass.
- Independent review v2: APPROVE, no P0-P3 findings.
- Exact-SHA publication: `3eb13c213945db9cb4fc307750296f747888bdd8`; CI `33476780919` and
  Pages `33476780923` succeeded.
- Independent deployed QA: PASS with Armored 72 -> 15 / effective 12 / damage 19 and Hardened
  96 -> 18 / effective 14 / damage 23; historical reload, desktop/narrow layout, accessibility,
  console, and network checks passed.
- Vault `AUTOBATTLEIDLE-DOC-20260827-A7FD1F` content hash
  `e0e8b996cab7e820137f178af009ee047572dd24d0325fe67dfdea896d927b52` records the accepted cap,
  historical-save normalization, and time-based receipts.

## Sign-off

- Reviewer: APPROVE
- QA: PASS
- Manager close: PASS — terminal Planner/QA/verification checkpoint follows the exact-SHA candidate
