---
plannerFormat: 1
id: ABI-016
artifact: verification
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

# ABI-016 verification

## Acceptance evidence

- Current boss cadence and all domain/persistence files are unchanged; existing characterization remains green in `pnpm check` 71/71.
- Battlefield owns a normalized session azimuth and enables it only for boss snapshots. Orbit changes azimuth only; Three.js PerspectiveCamera FOV/target and responsive radius/elevation framing remain fixed for each viewport. Ordinary snapshots retain azimuth-zero framing; no zoom or pan path exists.
- HUD Pointer Events arbitrate stationary activation from drag/cancel, use battlefield-only `touch-action: none`, and preserve Enter/Space attacks plus ArrowLeft/ArrowRight rotation intents. Application routes rotation only to battlefield presentation.
- Focused tests cover boss/ordinary gating, resize preservation, non-finite deltas, pointer drag/cancel/stationary input, keyboard mapping, application routing, and idempotent listener/resource teardown.
- Independent review passed after one bounded repair. Independent local real-browser QA passed desktop and 390px boss/ordinary scenarios with HP/event and screenshot-hash evidence, clean console/network, valid V2 reload, and no camera storage.
- Publication evidence: pending coherent commit/push, exact-SHA CI, GitHub Pages deployment, and public deployed functional smoke.

## Sign-off

- Reviewer: PASS — `abi016-independent-reviewer`
- QA: PASS (local) — `abi016-independent-qa`
- Manager close: pending publication and deployed proof
