---
plannerFormat: 1
id: ABI-038
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-023
  - ABI-026
  - ABI-037
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-038 analysis

## Verified current state

- `PlayerUnit` already uses the shared Unit MVC but currently constructs one `PlayerUnitView`; enemy visuals have the mature body/component/profile/decorator architecture. Evolution should extend the player owner, not reuse enemy state or add a parallel scene entity.
- ABI-020 defines elapsed-time progression stages and accepted high-level economy; those measured stages are the correct milestone input. ABI-037 provides the all-angle/animation approval surface required before production geometry.
- Current save V4 stores canonical progression/player upgrade state. A form can derive from existing values, so the default persistence classification is **no schema change**. A stored evolution ID is prohibited unless preflight proves derivation cannot preserve identity.
- The request is visual progression from egg/stone into more complex forms, not an inventory, character creator, equipment system, or stat bonus.

## Approach

- Freeze a small sequence of forms against ABI-020 stage boundaries and name the exact derivation rule. Each form must change silhouette and one animation/detail, not only palette.
- Prototype each form in ABI-037, review all angles and attack/idle states, then port approved recipes into player-local body/component factories.
- Let `PlayerUnitModel` expose derived presentation identity and `PlayerUnitView` own one current form subtree. Replace at one sync seam, optionally with a short visual-only handoff, and dispose the previous subtree once.
- Preserve combat input, camera framing, player attack origin, high-APS cadence, and all domain formulas.

## Risks

- Milestones based on a changing formula can visually regress old saves. Freeze against canonical values/stages and add boundary fixtures for V1-V4 migrations.
- Rebuilding on every snapshot leaks GPU resources. Replace only when derived form identity changes.
- Larger silhouettes can occlude enemies/HUD or move attack origins. Verify responsive framing and semantic sockets at every form.
- Scope can expand into cosmetics/equipment. Keep only the approved linear visual sequence; future customization is a separate product task.
