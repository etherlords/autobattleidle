---
plannerFormat: 1
id: ABI-002
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-001
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-002 implementation-guide

## Frozen scope

- Implement deterministic combat and reward simulation only in `src/domain` plus focused unit tests.
- Preserve current `BattleSnapshot` and application-shell contracts unless a minimal compatible domain export is needed.
- Do not add UI input, frame scheduling, persistence, upgrades, Three.js behavior, visual grades, or other ABI-003+ work.

## Implementation sequence

1. Define named combat state, enemy grade/modifier, attack source, random-roll, and result/event types.
2. Centralize minimal V1 balance constants and pure encounter/damage/reward formulas.
3. Implement one attack command used by both manual and automatic callers; apply source-specific automatic slow without changing manual attacks.
4. On lethal damage, grant one deterministic reward, advance encounter, and spawn the next enemy atomically.
5. Add focused tests for armor minimum damage, 2x critical damage, shared attack behavior, grade/boss cadence, double reward, and no duplicate death reward.
6. Run focused tests and `pnpm check`; record exact commands, elapsed time, files read, and tool use.

## Verification matrix

- Shared path: manual and automatic inputs call the same command and produce identical results when no automatic slow applies.
- Damage: armor is bounded to at least one and a critical is exactly 2x final damage.
- Death/reward: a lethal command grants reward once, advances encounter once, and returns a live next enemy; stale duplicate identity cannot pay twice.
- Progression: grade selection and boss cadence derive only from encounter number; seeded elite modifier is deterministic.
- Boundaries: domain modules import no DOM or Three.js code; ABI-003+ files remain untouched.
- Gates: focused Vitest, full `pnpm check`, independent Reviewer, independent QA, verification, and Manager closure.
