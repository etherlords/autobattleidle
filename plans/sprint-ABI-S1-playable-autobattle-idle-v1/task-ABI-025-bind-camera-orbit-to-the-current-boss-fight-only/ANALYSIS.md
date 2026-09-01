---
plannerFormat: 1
id: ABI-025
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-025 analysis

## Verified current state

- The original task contract was wrong: it explicitly required boss-only orbit and reset at every boss-fight boundary, while the requested product behavior is orbit for every enemy with one continuous viewing angle across replacements.
- `createHud` already emits pointer/touch drag and ArrowLeft/ArrowRight rotation intents without combat knowledge; the application routes them once to `BattlefieldLifecycle.rotateCamera`. Input routing does not need another owner.
- `BattlefieldLifecycle.rotateCamera` currently rejects input through `!bossOrbitEnabled`; `updateCamera` substitutes azimuth zero for ordinary and Golden enemies; `replaceEnemy` resets azimuth when `bossEncounterKey` changes. These three boss-only decisions are the root cause.
- Enemy replacement already has one visual lifecycle seam and preserves defeated-enemy death frames. Azimuth should remain battlefield-session state while the enemy subtree changes.
- Persistence impact is **no schema change**. Azimuth resets only when a new battlefield/session is created or explicitly reset, not on encounter replacement.

## Approach

- Keep HUD and application routing unchanged. Make `azimuth` the only battlefield-session orbit owner and accept finite rotation deltas whenever the battlefield is active.
- Use the same azimuth for ordinary, boss, and Golden framing. Preserve existing per-enemy distance/elevation rules; only the horizontal viewing angle becomes continuous.
- Remove replacement-time azimuth reset and boss encounter ownership. Initialization or an explicit user reset remains the only reset boundary.
- Replace boss-lock/reset tests with ordinary, boss, Golden, and all transition-pair continuity regressions. Deployed QA must drag ordinary enemies as well as bosses and prove the angle survives replacement.

## Risks

- Changing orbit eligibility must not change boss-specific distance, elevation, framing scale, attack input arbitration, modal isolation, or drag-versus-click suppression.
- Replacement code must not briefly render the next enemy at azimuth zero before applying the preserved angle; test the actual visual handoff, not only the final state.
- Persisting azimuth would exceed the request and change reload behavior. Keep it session-only.
