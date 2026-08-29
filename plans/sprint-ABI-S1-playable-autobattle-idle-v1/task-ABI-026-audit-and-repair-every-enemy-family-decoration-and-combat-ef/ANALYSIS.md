---
plannerFormat: 1
id: ABI-026
artifact: analysis
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

# ABI-026 analysis

## Verified current state

- The supplied Hydra frame pair shows an abrupt pose jump; Ember Colossus exhibits the same shared motion at a larger visible displacement.
- `EnemyViewBuilder` mounts body, grade, modifier, and decoration as sibling roots. `riggedBody` animates only the body/rig, so attached visual cues do not inherit the pose. A common pose parent fixes whole-body inheritance but is insufficient for deforming parts: crowns, hats, shields, and similar cues need semantic animated rig anchors (for example Hydra's center-head crown anchor), otherwise they remain static, intersect the body, or float away.
- Hit and critical frames apply fixed `1.1/0.9` and `1.2/0.82` scale changes, then `reset()` restores neutral transforms on the next idle frame. The endpoint discontinuity is shared by every rigged family.
- The critical battlefield cue is a four-sided `ConeGeometry` rotated onto the ground, producing the reported white triangular wedge.
- Existing Unit MVC, family builders/decorators, command stream, deterministic identity, and ring-effect path are sufficient. No new abstraction or dependency is required.
- Persistence impact: **no schema change**. Historical-save load/save/reload remains a required regression.

## Approach

- Introduce one pose root owned by the existing enemy builder for whole-body motion, and attach semantic decorations to named animated rig anchors for part-local deformation (center head, head, side/shield as applicable). Preserve authored local geometry transforms and audit every current attachment.
- Replace fixed endpoint scales with a bounded sine pulse that is neutral at progress 0 and 1 and peaks mid-frame. Use modest shared amplitudes so bosses cannot visibly jump.
- Reuse the existing ground-ring effect for the critical/attack cue and remove the cone path.
- Prove shared behavior with focused transform, continuity, displacement, cue-geometry, determinism, disposal, and historical-save tests, then exercise Hydra and Colossus in browser QA.

## Risks

- Moving transforms to a parent can double-apply local offsets if family geometry is reparented incorrectly; tests must compare local and world transforms.
- A generic root-only reparent would leave head decorations wrong during deformation; tests must prove named-anchor parentage and world motion, including Hydra's middle-head crown.
- A pulse that is too large remains distracting on bosses; bound peak scale numerically and verify both named bosses visually.
- Replacing cue geometry must retain lifetime, reduced-motion readability, and disposal behavior.
- Unrelated ABI-019/ABI-020 Planner drift, `.planner/operations`, and ABI-011 QA artifacts are explicitly outside scope and must remain untouched/unpublished.
