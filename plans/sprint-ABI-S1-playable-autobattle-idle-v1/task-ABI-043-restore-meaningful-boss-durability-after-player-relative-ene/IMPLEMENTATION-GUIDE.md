---
plannerFormat: 1
id: ABI-043
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-028
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-043 implementation-guide

## Frozen scope

- Change only boss durability, its deterministic measurement receipts, and compatibility validation for already-valid boss saves.
- Boss max HP is `min(legacyStageHealth, max(currentThirtyHitHealth, expectedAutomaticDps * 180 seconds))`, safe-rounded/saturated through the existing numeric policy. Expected automatic DPS composes the current base damage, effective encounter armor after penetration, critical chance, critical multiplier, and APS formulas.
- At encounter 2170 the envelope must leave the legacy anchor intact at max HP `19,373,445`; the authentic stored fraction must normalize back to current HP `1,805,505` (allowing only documented integer rounding). Early bosses must never be weaker than the deployed 30-hit formula.
- Keep ordinary 1/5/10-hit health, Golden Bug health/reward/window, boss cadence/reward/armor, player upgrades, attack packet logic, UI, worker, and save shape/version unchanged.
- No new dependency or speculative balance abstraction. The uncapped legacy curve is rejected and must not return; if this calibrated bounded envelope still fails the required measurements, return the measured blocker instead of inventing a third formula.

## Implementation sequence

1. Add focused boss-formula and encounter-2170 regression receipts around the existing spawn owner.
2. Route production bosses through the legacy ceiling / current floor / 180-second expected-DPS envelope while leaving all ordinary calls byte-for-byte equivalent in behavior.
3. Recognize the prior player-relative boss representation at the persistence boundary and normalize remaining-health fraction; preserve source slots.
4. Add bounded boss TTK summaries to the existing simulator/report path and prove exact/event-jump equivalence plus 48/49-hour continuation.
5. Run focused domain/persistence/simulator tests, the migration matrix, `pnpm check`, and diff check before independent review.

## Verification matrix

- Unit: exact boss HP at early, encounter 2170, stage checkpoints, and safe-number boundary; adjacent ordinary and Golden values unchanged.
- Integration: automatic-only, 100 ms manual-only, and combined TTK receipts; boss tougher than adjacent ordinary; exact/event-jump reports agree; 49-hour encounter exceeds 48-hour encounter.
- Persistence: current V4 player-relative boss and authentic V3 boss load -> normalize by fraction -> save V4 -> reload without encounter/progress reset; all golden migration fixtures remain green.
- Deployed: isolated codec fixtures show the stronger encounter-2170 boss, retained progress across reload, working attacks, finite HP/TTK, clean console, and desktop/narrow HUD readability.
