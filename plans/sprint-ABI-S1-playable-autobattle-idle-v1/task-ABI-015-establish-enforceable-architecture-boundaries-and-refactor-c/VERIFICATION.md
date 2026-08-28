---
plannerFormat: 1
id: ABI-015
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-008
  - ABI-009
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-015 verification

## Acceptance evidence

- Behavior-preserving module decomposition is covered by 23/23 deterministic tests and the accepted independent review of the complete diff from planning checkpoint `9bdbbd7c8ee8b8c323e6da9d1eba877bf090d94d`.
- Production layer ownership is enforced through ESLint for bare and nested imports; forbidden domain/game/UI/persistence probes fail and allowed domain imports pass.
- Public combat, visual, HUD, and persistence contracts remain stable; V2 and legacy save fixtures, malformed-save recovery, deterministic visual cues/seeds, disposal, keyboard/pointer input, focus restoration, and listener/resource stability passed.
- Initial desktop and narrow browser QA passed functional transitions, but the expanded visual audit found a P2 actor/crown clipping defect at `390px`; verification remains pending until repair and fresh review/QA.
- Vault doctor/index and Planner doctor must be fresh at manager closure; exact-SHA CI, Pages, and deployed proof are recorded after publication.

## Sign-off

- Reviewer: PASS — no unresolved P0-P2 after two bounded repairs and final full-diff re-review.
- QA: CHANGES_REQUIRED — P2 narrow actor/boss-crown clipping awaits repair and fresh independent visual QA.
- Manager close: pending
