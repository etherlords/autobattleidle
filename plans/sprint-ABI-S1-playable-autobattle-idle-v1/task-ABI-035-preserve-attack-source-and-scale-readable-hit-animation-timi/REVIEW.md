---
plannerFormat: 1
id: ABI-035
artifact: review
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

# ABI-035 review

## Verdict

CHANGES_REQUIRED — independent review v1.

## Findings

- **P1 — shortened cues retire before reaching the fixed slash endpoint.**
  `src/game/battlefield/effects.ts` keeps the 12-frame slash sweep while assigning 8 frames to manual
  cues and 6-7 frames to high-APS automatic cues. The effect is removed at its own lifetime, so those
  strikes disappear at only 50-67% of the accepted trajectory. Normalize phase progress to each
  effect's lifetime while retaining the fixed endpoints, and add an endpoint-at-expiry regression.

## Evidence

- Focused independent suite: 41/41 passed, but did not cover endpoint completion.
- `git diff --check`: passed.
- Review gate event: `evt-25a676d5-926a-498e-967c-9d875044640c`.

## Fresh review v2

### Verdict

APPROVE — no P0-P3 findings.

### Evidence

- The repair normalizes slash phase by each effect's `maximumLife`; manual 8-frame and automatic
  6-12-frame cues reach their fixed endpoint and opacity 0 on expiry.
- Reduced motion retains its non-displacing origin and retires opacity.
- Manual/automatic source and packet receipt remain immutable across controller -> presenter ->
  snapshot -> battlefield; combat, rewards, and saves remain unchanged.
- Fresh focused suite: 42/42. Full `pnpm check` and `git diff --check`: PASS.
- Review gate event: `evt-ab9c96f6-bc8e-4ade-bce1-06f789a29732`.
