---
plannerFormat: 1
id: ABI-004
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004 implementation-guide

## Frozen scope

- Compose ABI-002 combat state into the existing application and DOM HUD only. Preserve the current
  bounded Three.js shell; do not add ABI-003 enemy models, grade visuals, animation, or effects.
- Deliver manual pointer/keyboard attacks, unlocked automatic scheduling/countdown, enemy HUD,
  bounded event log, currency, and exactly five upgrade paths. Persistence remains ABI-005 scope.

## Implementation sequence

1. Add centralized upgrade balance/types and a pure atomic purchase operation with focused tests.
2. Derive a richer immutable UI/game snapshot from live `CombatState` and bounded recent events.
3. Refactor application composition to own live state, injected time/rolls, manual commands, automatic
   frame scheduling, render-on-change/countdown updates, and clean idempotent disposal.
4. Build stable accessible DOM controls for enemy HP, automatic countdown, click/key attack, coins,
   five upgrades with disabled reasons, and a bounded polite log; add responsive CSS.
5. Add focused integration tests for actual state transitions, cooldown independence, exactly-once
   scheduling/input, reward log, upgrades, layout contracts, and disposal; run `pnpm check`.

## Verification matrix

- **Unit:** upgrade prices/caps/prerequisites/atomic currency; domain attack/cooldown invariants; bounded
  event projection.
- **Integration:** injected frame time proves HP changes, manual cooldown independence, exactly one
  automatic attack/reset, kill/reward/log, five control states, and listener/frame disposal.
- **Deployed:** real pointer and keyboard activation reduce HP without cooldown reset; unlock shows a
  draining seconds+milliseconds countdown, one attack at zero, and reset; kill updates coins/log and
  encounter; all upgrades expose costs/disabled reasons; desktop and narrow layouts remain usable;
  console stays clean.
