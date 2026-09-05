---
plannerFormat: 1
id: ABI-052
artifact: brief
project: ABI
profile: high-assurance
revision: 10
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-051
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-052: Add Catbug and Evil Catbug GLB bosses

## Goal

Add Catbug and Evil Catbug GLB bosses

## Work item

- Type: story
- Priority: high
- Status: Done
- Parent: None

## Acceptance criteria

- [ ] Catbug and Evil Catbug GLB files are shipped as embedded public assets; the user supplied both assets and grants free-to-use rights, which are recorded in the asset metadata/license note; authored textures are not replaced.
- [ ] Production boss selection reaches both new boss identities deterministically and presents readable Catbug labels.
- [ ] Three.js loads and renders both GLB meshes with their embedded materials and textures.
- [ ] Each enemy instance receives a safe clone of the GLB scene resources, and disposal releases cloned geometries, materials, and textures without leaking resources.
- [ ] Scale, ground contact, actor position, camera framing, and desktop/mobile HUD clearance are reviewed and tuned for both meshes.
- [ ] Existing spawn, hit, critical, and death command lifecycle animates both bosses; supplied files currently have no morph targets or skeletal animations, so group-transform animation is used honestly unless revised assets provide morph targets that are explicitly mapped.
- [ ] Existing affinity, grade, and modifier effects remain overlays and do not mutate the GLB source materials or textures.
- [ ] Historical saves load and reload without schema changes or progress loss, and focused plus full project checks pass.

## Dependencies

- ABI-051

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
