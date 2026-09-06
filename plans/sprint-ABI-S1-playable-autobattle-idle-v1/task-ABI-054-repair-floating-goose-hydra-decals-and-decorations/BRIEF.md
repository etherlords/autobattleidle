---
plannerFormat: 1
id: ABI-054
artifact: brief
project: ABI
profile: high-assurance
revision: 4
status: In QA
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-054: Repair floating Goose Hydra decals and decorations

## Goal

Repair floating Goose Hydra decals and decorations

## Work item

- Type: bug
- Priority: high
- Status: In QA
- Parent: None

## Acceptance criteria

- [ ] Unit: standalone seeded-decoration and affinity-cue meshes for Goose Hydra fit the loaded authored GLB bounds/sockets or are suppressed when no valid fit exists; Catbug, legacy/no-overlay, and procedural families retain existing behavior.
- [ ] Unit: semantic DecalGeometry patches are created only from validated loaded-body projections and invalid/clipped patches are rejected; no global transform tweak.
- [ ] Integration: after Goose Hydra GLB load, visible cue/decal geometry remains attached to the authored body envelope during animation and no observed floating meshes remain.
- [ ] Deployed: visual-lab production Goose Hydra scenario verifies loaded-body cue/decal placement with a bounded browser screenshot/console check.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
