---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260905-E4B160
kind: decision
status: active
summary: >-
  Progression-aware seeded boss gaps, ABI-029 identity reuse, Golden separation,
  persistence, and exact/event-jump proof recorded from ABI-039 closure
  receipts.
tags:
  - ABI-039
  - bosses
  - cadence
  - deterministic
  - progression
  - simulation
aliases:
  - ABI-039 Boss Cadence
  - Deterministic Boss Cadence
---
# ABI-039 Deterministic Boss Cadence

## Summary

Progression-aware seeded boss gaps, ABI-029 identity reuse, Golden separation, persistence, and exact/event-jump proof recorded from ABI-039 closure receipts.

## Decision

ABI-039 uses one centralized, progression-aware, deterministic boss schedule. The schedule is seeded from the fixed `BOSS_CADENCE_BALANCE.seed` and ordinal/band inputs, has bounded variation, and reconstructs without adding a save field or changing the V4 save schema. Exact simulation and event-jump simulation remain equivalent at the accepted horizons.

## Cadence and identities

The source schedule keeps the first gap at 35 for historical compatibility, then draws each gap independently from its ordinal band using `minGap + (seededOffset((ordinal - band.firstBoss) % 16, band) % (maxGap - minGap + 1))`. The production bands are early ordinals 1–3 at 28–42, mid 4–11 at 24–46, late 12–31 at 26–44, and long-run 32+ at 28–42; `bossEncounterForOrdinal` starts at encounter 35 and sums the scheduled gaps for later ordinals. The current source is `src/domain/combat/balance.ts` and `src/domain/combat/boss-cadence.ts`.

The canonical current measured report is `plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-029-compose-deterministic-elemental-enemy-variants-from-reusable/MEASURED-REPORT-AFFINITY.json`. Its production `firstTenGaps` are `[35,36,33,36,27,35,42,44,37,46]`, with measured first-ten bounds 27–46; the report's `bossGaps` field omits the initial historical-compatible 35. Boss identity selection consumes ABI-029 family/affinity-profile outputs through the existing registry; the scheduler does not recreate names, stats, visuals, or family-affinity content. Golden Bug remains a separate authored event and is not replaced by the boss scheduler.

## Balance and lifecycle

Goose Hydra variants remain inside the accepted adjacent durability/TTK/reward envelope. Existing boss camera, rigs, sockets, effects, replacement, reset, and disposal ownership are reused. Historical V3/V4 reload preserves deterministic cadence and identity behavior, while safe ordinal outputs and exact resource return-to-baseline remain required invariants.

## Evidence

- Canonical current ABI-029 measured report: `MEASURED-REPORT-AFFINITY.json`, including `cadence.firstTenGaps` and `cadence.bossGapBounds` (27–46).
- Source cadence definition and reconstruction: `src/domain/combat/balance.ts` (`BOSS_CADENCE_BALANCE`) and `src/domain/combat/boss-cadence.ts` (`bossGapForOrdinal`, `bossEncounterForOrdinal`).
- Planner ABI-039 independent-review PASS: `evt-7b771b01-3142-46e7-9f1b-7f74c9f5e370`, progress revision 65.
- Planner ABI-039 independent-qa PASS: `evt-6909ff10-ffdb-4d28-91d3-79238d1bb50a`, progress revision 67.
- Planner ABI-039 verification PASS: `evt-b688d32a-dd09-4177-94d8-b3e4ef371ba9`, progress revision 68.
- Planner ABI-039 manager-closure PASS: `evt-303437c7-bb9d-4e0e-ad16-41e7d3ecfbc6`, progress revision 70; task closure revision 71.
- ABI-039 implementation receipt `evt-03c37a5f-82da-4711-91ce-955d5c692ffa`, progress revision 62, records the production cadence and 48-hour gap arrays in the generated ABI-029 measured report.

## Boundaries

`src/domain` owns deterministic schedule and progression; the existing ABI-029 registry owns family/affinity content; `src/game` consumes snapshots and reuses presentation lifecycle. No wall-clock randomness, duplicated content registry, or save-schema expansion is part of this decision.

## Related

- [[design/Enemy Tiers and Boss Cadence|Enemy Tiers and Boss Cadence]]
- [[design/Combat Loop|Combat Loop]]
- [[architecture/Technical Architecture|Technical Architecture]]
- [[architecture/Persistence Contract|Persistence Contract]]
