---
plannerFormat: 1
id: ABI-019
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-019 analysis

## Verified current state

- `BattleController.performFrame` is the single automatic scheduler owner and compares frame time with
  `CombatState.nextAutomaticAttackAtMs`; manual attacks already bypass that deadline.
- `BattleStatus` owns the automatic progress/text presentation, while `HudIntent` and
  `startApplication` provide the existing UI-to-controller command path.
- ABI-018 already exposes APS and remaining cooldown. Elite `automatic-slow` remains part of
  `automaticInterval`; persistence stores combat state but has no presentation/session pause field.
- Vault `AUTOBATTLEIDLE-DOC-20260827-85CBFC` freezes a real accessible button, exact frozen remainder,
  auto-only effect, and reload-running semantics.

## Approach

- Keep pause ownership in `BattleController`, beside the scheduler. Add one named toggle command and
  one session-only frozen-remainder value; paused frames still advance time and expire Golden Bugs but
  skip automatic attacks.
- On pause, capture `max(0, nextAutomaticAttackAtMs - nowMs)`. On resume, set the next automatic
  deadline to `nowMs + frozenRemainder`; do not publish a persistence change.
- Expose paused state and effective remaining time through the existing update/snapshot pipeline.
  `BattleStatus` renders one compact button beside the automatic status and emits one HUD intent.
- Keep the button disabled while automatic attack is locked. Reset/restore/reload start running and do
  not add a save field.

## Risks

- A pause implemented in the animation loop would freeze unrelated timers; controller ownership avoids
  that regression.
- Reusing an absolute pre-pause deadline on resume would cause catch-up; resume must rebase the frozen
  remainder on current controller time.
- Manual kills can change the enemy/modifier while paused. The frozen remainder remains exact; future
  attacks continue using normal domain scheduling after the first resumed attack.
- Persistence impact: no schema change. Historical V3/V4 load/reload must remain valid and pause must
  default to running because it never enters a codec.
