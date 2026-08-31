---
plannerFormat: 1
id: ABI-036
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
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

# ABI-036 analysis

## Verified current state

- The production visual system uses authored Three.js primitive geometry, materials, keyed components, semantic sockets, family profiles, deterministic variants, and explicit disposal. No `DecalGeometry`, `CanvasTexture`, imported surface map, or texture cache exists.
- ABI-026/031 repaired attachments and animation-local anchors; ABI-029 will add family/affinity combinations after ABI-020. Surface work must build on those stable identities, otherwise decals will be authored against shapes that are still changing.
- Installed Three.js 0.185.1 provides the necessary core texture APIs and an examples `DecalGeometry`, but using the examples helper, procedural canvas maps, UV maps, or overlay meshes has different bundle/resource/deformation behavior and must be measured.
- Current V1 scope says no external asset pipeline. The user request intentionally expands surface quality, so the task must record whether code-generated/CC0 texture assets are an approved bounded exception.
- Persistence impact is **no schema change** when selection derives from existing family/profile/affinity/seed identity.

## Approach

- Build one disposable spike using representative rigid, segmented, and deforming bodies. Compare projected decal geometry, procedural `CanvasTexture`, authored UV/material maps, and current overlay geometry for scratches, cracks, runes, shell/flesh differences, and affinity marks.
- Measure appearance at all angles and animation frames plus draw calls, triangles, texture bytes, creation time, bundle bytes, cache reuse, replacement, and disposal. Choose per need: there is no requirement to force one technique everywhere.
- Place accepted surfaces from semantic local-space data owned by the family/component. Deterministic identity chooses bounded variants; renderer time and camera position do not.
- Add a small texture/material cache only if reuse measurements justify it. Reference counting or owner-local disposal must be explicit and covered by long replacement tests.

## Risks

- `DecalGeometry` captures a mesh pose and may not follow later deformation; a projected decal that looks correct only in the bind pose fails this task.
- Coplanar overlays cause z-fighting; excessive transparent surfaces increase overdraw; large canvases leak GPU memory. The spike needs hard budgets and mobile/narrow proof.
- Negative scales/winding and generated UVs can invert or hide marks. Test mirrored family components and camera orbit.
- External textures introduce licensing and cache-path risk. Default to deterministic code-generated or reviewed CC0 assets with a manifest.
