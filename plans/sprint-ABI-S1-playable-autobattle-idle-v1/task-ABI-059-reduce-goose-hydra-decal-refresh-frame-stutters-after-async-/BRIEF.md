---
plannerFormat: 1
id: ABI-059
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-056
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-059: Reduce Goose Hydra decal refresh frame stutters after async scheduling

## Goal

Reduce Goose Hydra decal refresh frame stutters after async scheduling

## Work item

- Type: bug
- Priority: high
- Status: Done
- Parent: None

## Acceptance criteria

- [ ] Unit: deterministic projection-cache and raycast-work reuse/identity behavior is covered, including cancellation/disposal and Catbug/procedural fallbacks.
- [ ] Integration: Goose Hydra semantic-surface decoration refresh preserves visual validity and deterministic output while keeping per-frame decal work within the measured budget; no save-schema change and historical-save load/reload remains compatible.
- [ ] Deployed: the production build is exercised in a real browser for Goose Hydra cold and repeat refresh paths with before/after decal geometry/raycast/frame-gap measurements recorded; report remaining cold network/GLB decode limitations without claiming zero lag.
- [ ] Persistence: no schema change; supported historical saves load and reload without reset.

## Dependencies

- ABI-056

## Related knowledge

- ABI-056

## Constraints

- Follow the resolved workflow contract and project instructions.
