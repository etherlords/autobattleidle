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

- `createHud` emits pointer/touch drag and ArrowLeft/ArrowRight rotation intents without combat knowledge; the application routes them to `BattlefieldLifecycle.rotateCamera`.
- `BattlefieldLifecycle` already rejects rotation unless the displayed enemy is a boss and keeps `azimuth` through hits and resize. Ordinary and Golden Bug framing already force azimuth zero.
- Root cause: `azimuth` has no boss-fight owner and `replaceEnemy` never resets it. A later boss therefore re-enables the previous session azimuth.
- Lethal replacement deliberately keeps the defeated boss displayed through impact, pause, and death frames; reset must occur only when `replaceEnemy` installs the next enemy, not when the combat snapshot first changes.
- Persistence impact: **no schema change**. Camera, gesture, and boss-fight ownership remain presentation-session state and never enter snapshots, codecs, or localStorage.

## Approach

- Keep input routing unchanged. Bind the existing azimuth to the displayed boss encounter level inside `BattlefieldLifecycle`, the single camera/enemy lifecycle owner.
- In `replaceEnemy`, compare the next boss identity with the current owner; reset azimuth before installing any ordinary, Golden Bug, or different boss, while preserving it for sync/hit/resize of the same displayed boss.
- Add one focused lifecycle regression covering ordinary lock, boss rotate/resize, lethal transition preservation, ordinary reset, and next-boss canonical start. Retain existing HUD drag/click/modal/disposal tests.
- Acceptance layers: lifecycle and input are unit/integration; desktop pointer/keyboard and 390px touch across two bosses are deployed QA.

## Risks

- Resetting from the incoming combat snapshot would visibly snap the camera while the defeated boss death animation is still playing; reset only at visual replacement.
- Gating rotation in the HUD would duplicate combat state and weaken modal/input ownership; keep the guard in the battlefield.
- Persisting azimuth or owner would violate reload-reset behavior; no persistence changes are allowed.
