---
plannerFormat: 1
id: ABI-053
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: In Progress
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

# ABI-053: Preserve legacy bosses and improve Catbug GLB presentation

## Goal

Preserve legacy bosses and improve Catbug GLB presentation

## Work item

- Type: bug
- Priority: high
- Status: In Progress
- Parent: None

## Acceptance criteria

- [ ] Existing Colossus and Hydra boss identities and procedural visuals remain available and unchanged in production selection.
- [ ] Catbug and Evil Catbug are additional deterministic boss identities, so the visual lab exposes four boss families.
- [ ] Replace the Catbug GLB asset with the user-supplied Meshy_AI_Ladybug_Kitty_0905011537_texture.glb only after browser GLTFLoader validation; preserve Evil Catbug unless explicitly superseded.
- [ ] Catbug and Evil Catbug materials use authored textures while avoiding unintended metallic response; Goldbug and other intentionally metallic mobs retain metallic materials.
- [ ] Boss GLB lighting and polygon presentation are reviewed in deployed visual lab at desktop and 390px narrow viewport; overlays, lifecycle, cloning, disposal, and historical saves remain compatible.
- [ ] Focused and full project checks pass, with independent review, independent QA, and deployed Pages proof.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
