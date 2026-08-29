---
plannerFormat: 1
id: ABI-016
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-016 analysis

## Verified current state

- Planner 1.1.2 is bound to the project-local stdio entrypoint; the installed package and checksum-pinned archive both identify 1.1.2. `planner_doctor` is healthy with no recovery, `planner_next_task` selects ABI-016, ABI-015 and ABI-023 are Done, and no foreign lease exists.
- Git `main`, `origin/main`, and clean HEAD are `bf9f97eb3ad88bdf20a176c8aeac012090b107c8` after a fresh fetch.
- `src/game/battlefield/lifecycle.ts` owns the PerspectiveCamera, renderer, responsive framing, and idempotent final teardown. Its current camera is static at azimuth zero and `resize` recalculates elevation/radius scale from aspect.
- `src/ui/hud.ts` owns battlefield focus plus pointer-up and Enter/Space attack listeners. It currently cannot distinguish a stationary activation from a drag. HUD controls live in a fixed overlay and receive pointer events independently.
- `src/app/application.ts` owns window resize and composes HUD intents with domain commands. Combat and persistence do not need camera knowledge.
- Vault authority keeps combat deterministic, battlefield presentation in `src/game`, input/listener lifecycle in `src/ui`, and runtime presentation objects out of saves. The one Vault doctor call timed out; the bounded Vault search and all five canonical related articles succeeded from a fresh index.
- Boss cadence is currently `COMBAT_BALANCE.bossInterval = 35`; the Vault cadence article still says 15 and is stale for this fact. ABI-016 changes neither cadence nor any health, reward, critical, armor, upgrade, or save formula.

## Approach

- Add the smallest shared battlefield interaction contract: a session-only azimuth owned by the battlefield, plus an input seam that lets HUD arbitrate pointer drag versus activation and send orbit deltas without introducing domain state.
- Keep FOV, look-at target, configured elevation, and configured radius fixed for a given aspect. `resize` reapplies the same azimuth with the existing responsive scale; no wheel, pinch zoom, or pan path is added.
- Enable orbit only when the rendered snapshot is a boss. Ordinary encounters keep the existing azimuth-zero framing and ignore rotate input; entering a boss starts from the current session azimuth, while leaving a boss restores ordinary framing without changing combat identity.
- Pointer/touch uses Pointer Events on the battlefield host with one active pointer, capture when available, a small movement threshold, and exactly one outcome: stationary pointer-up emits one attack; threshold-crossing drag emits rotation and no attack. Enter/Space remains one attack; ArrowLeft/ArrowRight rotates only while focused and only during a boss.
- Keep modal/HUD isolation by attaching battlefield interaction listeners only to the battlefield host and preserving overlay pointer ownership. Teardown remains idempotent and removes every added listener/capture path once.

## Risks

- Click/drag arbitration can double-fire or suppress activation; prove stationary, threshold, multi-move, pointer-cancel, and keyboard cases with focused tests.
- Responsive scaling can accidentally reset azimuth; assert angle preservation across narrow/desktop resize while radius/elevation follow the existing aspect scale.
- Orbit can leak into ordinary encounters or persistence; characterize ordinary camera position and historical V1/V2 load/reload unchanged.
- Pointer capture is not uniformly available in test doubles; use feature detection, not assertions or a dependency.
- Resource/listener leaks can hide behind idempotent outer disposal; count add/remove and renderer/resource disposal directly.

## Acceptance layers and persistence

- Unit: azimuth math, fixed target/FOV/elevation/radius, aspect resize preservation, boss-only enablement, stationary-versus-drag arbitration, keyboard mapping, cancel, and idempotent listener disposal.
- Integration: boss snapshot enables orbit; ordinary snapshot does not; pointer/keyboard attack counts remain exact; HUD/modal controls do not rotate; application resize preserves angle; historical saves load and reload unchanged.
- Deployed: desktop pointer and keyboard plus 390px touch-style drag, boss and ordinary encounters, clean console/network, bounded scene/listeners/resources, exact-SHA Pages deployment.
- Persistence impact: no schema change. Camera azimuth and gesture state are session-only presentation state and must not enter `CombatState`, snapshots, codecs, fixtures, or localStorage.
