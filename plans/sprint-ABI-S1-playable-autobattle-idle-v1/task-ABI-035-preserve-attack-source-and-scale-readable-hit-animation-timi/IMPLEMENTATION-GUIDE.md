---
plannerFormat: 1
id: ABI-035
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-020
  - ABI-023
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-035 implementation-guide

## Frozen scope

- Preserve attack source and make existing hit visuals readable across manual, low APS, and 10+ effective APS. No combat formula, audio, new effect style, or save change.
- Reuse `BattleController -> presenter -> BattleSnapshot -> battlefield -> effect lifecycle`; add one typed cue contract at the current lossy seam.
- Reuse ABI-020's accepted 3 Hz visible tick and shared packet schedule; do not derive a second scheduler or animate every resolved packet.

## Implementation sequence

1. Enumerate every `BattleVisualCue` producer/consumer and freeze manual, automatic, batched, critical, armor, lethal, replacement, reset, and reduced-motion expectations.
2. Introduce the minimum discriminated cue type at the current string-only seam and carry source plus the existing packet receipt through presenter and snapshot tests.
3. Centralize manual and automatic duration bounds in battlefield effect configuration; drive existing phases and retire when visually complete.
4. Preserve lethal pause/death order and decoration/camera behavior; add no scheduler outside the existing render tick.
5. Add focused unit/integration tests and deterministic browser fixtures for low, mid, and 10+ APS.
6. Run independent review, QA, `pnpm check`, Vault sync, and exact-SHA Pages proof.

## Verification matrix

- **Unit:** discriminated cue exhaustiveness; source retention; finite clamped timing; low/mid/high APS; packet aggregation; critical/armor identity; reduced motion; exact retirement.
- **Integration:** controller through battlefield for manual/automatic/batched/lethal events; no changed damage/event/reward/save bytes; resize/replacement/reset/disposal.
- **Browser/deployed:** frame receipts at low APS and 10+ APS, manual faster than automatic presentation, visible critical/armor distinction, hit-pause-death order, desktop/390px, clean resources/console, exact SHA.
