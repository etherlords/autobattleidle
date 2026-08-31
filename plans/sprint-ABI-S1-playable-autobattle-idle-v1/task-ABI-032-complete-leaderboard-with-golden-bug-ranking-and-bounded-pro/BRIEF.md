---
plannerFormat: 1
id: ABI-032
artifact: brief
project: ABI
profile: high-assurance
revision: 11
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-013
  - ABI-030
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-032: Complete leaderboard with Golden Bug ranking and bounded progress synchronization

## Goal

Complete leaderboard with Golden Bug ranking and bounded progress synchronization

## Work item

- Type: bug
- Priority: critical
- Status: Done

## Acceptance criteria

- [ ] The leaderboard exposes two explicit ranking modes, Level and Golden Bugs, each with Top 100 and Around Me/current-rank views and deterministic tie-breaking; no opaque combined score is introduced.
- [ ] CombatState and a version-bumped save schema own a non-negative safe-integer cumulative Golden Bug defeat count. A Golden Bug increments it exactly once only when defeated, never on escape or ordinary/boss defeat.
- [ ] V1, V2, and V3 saves migrate one version at a time without losing valid progress; because historical Golden Bug defeats are not reconstructable, migration initializes the new counter to zero and records this compatibility limit.
- [ ] A forward-only D1 migration adds the Golden Bug metric and required ranking timestamps/indexes without rebuilding or deleting existing player rows; existing rows remain valid with zero Golden Bugs.
- [ ] The browser submits one progress snapshot containing current level and cumulative Golden Bug defeats. The Worker validates bounds and applies monotonic independent maxima atomically.
- [ ] Progress is dirty only after either metric increases. It is submitted after a defeated boss or when five minutes have elapsed since the last successful submission, whichever occurs first; a successful submission acknowledges the latest snapshot and restarts the five-minute window.
- [ ] Only one submission may be in flight. Changes during an in-flight request are coalesced into the next snapshot; failures retain dirty progress and do not create per-frame or per-level retry storms.
- [ ] Worker routes dispatch only. HTTP handlers own request/auth/response mapping, feature services own use-case orchestration, Drizzle-backed repositories own all D1 access, and handlers/services contain no SQL.
- [ ] A named Drizzle SQLite schema remains compatible with Wrangler migrations 0001 and 0002; repository and local D1/API tests prove unchanged identity, profile, rate-limit, deletion, and dual-ranking behavior.
- [ ] Focused tests prove Golden Bug defeat/escape counting, save migrations and reload, D1 migration compatibility, both ranking modes, monotonic snapshot updates, boss-triggered submission, five-minute submission, success timer reset, in-flight coalescing, failure behavior, and no per-level spam.
- [ ] Independent review and deployed QA verify the migrated Worker/D1 plus public Pages UI on desktop and narrow viewports, with exact-SHA CI/Pages/Worker evidence and preserved existing leaderboard players.

## Dependencies

- ABI-010
- ABI-013
- ABI-030

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260830-86F521

## Constraints

- Follow the resolved workflow contract and project instructions.
