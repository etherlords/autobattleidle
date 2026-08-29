---
plannerFormat: 1
id: ABI-026
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-007
  - ABI-022
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-026 implementation-guide

## Frozen scope

- Repair shared animation continuity, semantic animated-anchor attachment motion, critical/attack cue readability, and excessive boss displacement reported for Hydra and Ember Colossus.
- Work only in the existing enemy visual builder/body animation/effect owners plus focused tests. Do not change simulation balance, persistence schema, ABI-020, or unrelated dirty artifacts.
- Preserve deterministic family/variant identity, current event timing contracts, reduced-motion cues, and disposal ownership.

## Implementation sequence

1. Add one common pose root under the existing enemy view root for whole-body motion.
2. Expose/reuse named animated rig anchors and mount each decoration/modifier to the semantic body part it represents; Hydra's crown follows the center head. Keep authored geometry local to its anchor and audit position, scale, and orientation across all existing cues.
3. Replace hit/critical endpoint scale constants with a neutral-to-peak-to-neutral sine pulse using smaller bounded amplitudes.
4. Replace the four-sided critical cone with the existing circular ground-ring construction.
5. Add the smallest focused regressions, run focused tests and `pnpm check`, then perform independent review and browser QA.

## Verification matrix

- **Unit:** whole-body layers inherit the pose parent; semantic decorations inherit the correct animated rig anchor; Hydra's crown follows its center head; first/final hit and critical samples are neutral; peak scale is bounded; Hydra and Colossus use the same contract; critical cue is ring/circular rather than cone; deterministic seeds and disposal remain stable.
- **Integration:** historical supported save loads, retains enemy identity, saves, and reloads without schema loss; combat commands still play once and expire.
- **Browser/deployed:** at 1280x800 and 390x844, capture Hydra and Ember Colossus idle/hit/critical sequences, confirm attachments follow the pose, no abrupt endpoint jump, readable circular cue, reduced-motion equivalent, clean console/network, and exact-SHA Pages runtime.
