---
plannerFormat: 1
id: ABI-016
artifact: implementation_guide
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

# ABI-016 implementation-guide

## Frozen scope

- Implement only constrained boss-arena azimuth rotation. Preserve current encounter cadence, combat/reward formulas, deterministic enemy/player visuals, save schemas, and ordinary encounter behavior.
- Reuse Three.js `PerspectiveCamera`; add no controls package, zoom, pan, inertia, configuration framework, or persisted camera DTO.
- Battlefield owns orbit state and camera framing. HUD owns accessible battlefield input and emits typed presentation intent; application only wires that intent to battlefield presentation. Domain and persistence remain untouched except for regression evidence.

## Implementation sequence

1. Extend the battlefield contract with the minimum boss-aware rotation operation and keep azimuth normalized. Reframe with `sin/cos` at the existing responsive radius/elevation and fixed target/FOV.
2. Render sets boss-orbit eligibility from the immutable snapshot. Ordinary rendering uses the existing framing; boss rendering uses the session azimuth. Resize recalculates scale without resetting azimuth.
3. Replace unconditional `pointerup -> attack` with one Pointer Events gesture arbiter on the battlefield host. Stationary activation emits one attack; a threshold-crossing primary drag emits rotation deltas and never attacks; cancel clears the gesture. Feature-detect pointer capture.
4. Preserve Enter/Space exactly-once attack and add non-repeating ArrowLeft/ArrowRight orbit requests while the battlefield is focused. Do not install document-level rotation or wheel listeners.
5. Wire the typed orbit request in the application to the battlefield only. Keep HUD/modal controls outside the battlefield target and keep disposal idempotent.
6. Add focused tests at the responsible layers, run `pnpm check`, and hand off exact files/commands/evidence for independent review and QA.

## Verification matrix

- Camera unit/integration: boss drag and arrows change azimuth; target, FOV, elevation, and radius stay fixed; no zoom/pan APIs; narrow/desktop resize preserves angle; ordinary snapshots ignore orbit and retain static framing.
- Input integration: stationary pointer activation, Enter, and Space each attack once; repeated keydown is ignored; drag/multi-move/cancel never attacks; HUD/modal pointer paths never rotate.
- Lifecycle: each added listener is removed once; repeated battlefield/HUD/application disposal does not repeat renderer, resource, listener, or RAF cleanup.
- Compatibility: existing combat/progression characterization stays green; authentic V1, current V2, and legacy V2 load/reload unchanged; camera data is absent from serialized payloads.
- Browser/deployed: real desktop and 390px boss plus ordinary scenarios record initial state, action, result, attack count/HP, camera change or non-change, resize result, console/network health, and exact deployed SHA.
