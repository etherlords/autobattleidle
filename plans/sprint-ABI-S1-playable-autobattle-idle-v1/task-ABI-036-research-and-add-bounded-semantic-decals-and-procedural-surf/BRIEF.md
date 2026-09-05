---
plannerFormat: 1
id: ABI-036
artifact: brief
project: ABI
profile: high-assurance
revision: 9
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
  - ABI-029
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-036: Research and add bounded semantic decals and procedural surface textures

## Goal

Research and add bounded semantic decals and procedural surface textures

## Work item

- Type: research
- Priority: normal
- Status: Done

## Acceptance criteria

- [ ] A measured spike compares THREE.DecalGeometry, UV/material maps, CanvasTexture-generated marks, and simple geometry overlays for scratches, shell plates, runes, scars, cracks, and affinity marks across representative animated families.
- [ ] The decision records visual quality from multiple angles, behavior under idle/hit/death deformation, draw calls, triangles, texture memory, build bytes, creation/disposal cost, mobile support, and maintenance cost; it chooses the smallest technique per semantic surface need rather than one universal system.
- [ ] Every shipped mark has a named semantic purpose and authored placement tied to existing body/component sockets or stable local-space geometry. No render-time randomness, z-fighting, inside-out normals, detached decoration, or camera-facing cheat is accepted.
- [ ] Procedural textures are deterministic from canonical presentation identity, use bounded resolution and color space/filtering settings, and are cached/reused with explicit lifetime and idempotent disposal; user-created canvases or external URLs never enter the material pipeline.
- [ ] At least scratches plus two other semantic surface treatments are implemented on representative ordinary and boss families, including one deforming/animated body and one affinity-ready variant, without replacing approved legacy geometry.
- [ ] The task explicitly reconciles the existing V1 no-external-asset-pipeline decision. Any imported bitmap requires a reviewed license manifest; the default path remains code-generated or CC0 and adds no runtime CDN dependency.
- [ ] Reduced-motion, resize, camera orbit, all-angle inspection, historical-save reload, effect caps, WebGL resource counts, and long replacement loops remain stable.
- [ ] Focused tests prove deterministic selection, placement, cache identity, bounds, supported material settings, disposal, and no schema change. Visual QA compares before/after at all angles and representative animation frames on desktop and narrow layouts.
- [ ] Independent review, independent QA, pnpm check, exact-SHA CI/Pages, public asset proof, and Manager closure pass.

## Dependencies

- ABI-023
- ABI-026
- ABI-029

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-26DD42

## Constraints

- Follow the resolved workflow contract and project instructions.
