---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260905-109628
kind: decision
status: active
summary: >-
  Bounded deterministic scratch, shell-plate, and affinity-mark generation,
  socket placement, cache limits, and disposal ownership recorded from ABI-036
  closure receipts.
tags:
  - ABI-036
  - semantic-surface
  - scratches
  - decals
  - threejs
  - disposal
aliases:
  - ABI-036 Semantic Surface
  - Semantic Surface Generation and Disposal
---
# ABI-036 Semantic Surface Generation, Placement, and Disposal

## Summary

Bounded deterministic scratch, shell-plate, and affinity-mark generation, socket placement, cache limits, and disposal ownership recorded from ABI-036 closure receipts.

## Decision

ABI-036 uses the existing production enemy-visual composition owners for three explicit, bounded semantic treatment modes: `scratches`, `shell-plates`, and `affinity-mark`. Legacy/no-overlay composition remains available and is not replaced. The treatment contract is family-owned and deterministic; derived visual identity is rebuilt from canonical snapshots and is not persisted.

## Generation and placement

Each generated surface is a `DecalGeometry` projection against the owning enemy body mesh, not a detached primitive. The patch center is transformed to world space, raycast toward the body along the face normal, and snapped to the hit point with a small outward depth offset; the decal orientation maps local `+Z` to the world-space surface normal. Decal positions and normals are then transformed into the attachment parent’s local space, so the generated mesh inherits the body socket/anchor transform and animation. Body replacement can reproject the generated surface through the component refresh hooks.

The explicit mode contract always emits `scratches` and `affinity-mark`; `shell-plates` is additionally emitted for beetle, brute, sentinel, drake, boss-colossus, and boss-catbug families. Shell plates use left/right body faces, scratches use the front face, and affinity marks use the flank face. Detached global offsets and random primitive placement are rejected. The accepted orientation receipts include Drake front `+X`, Drake right/left flanks `+X`/`-X`, and animated Mantis flank coverage. Representative ordinary, boss, deforming, and affinity-ready cases remain covered without duplicating legacy geometry.

## Cache and disposal

The affinity texture cache has a hard cap of eight active palettes. At saturation, generation deterministically degrades to a solid mark without growing the cache. Generated resources detach before disposal; reference-counted sharing and repeated disposal are idempotent, returning resources to baseline. The cache key, ownership, and lifetime stay within the semantic-surface decorator rather than the domain save model.

## Evidence

- Source implementation `src/game/enemy-visual/decorators/semantic-surface-decorator.ts` owns the `DecalGeometry` body projection and the explicit treatment-mode selection.
- Planner ABI-036 independent-review PASS: `evt-b015ab8a-8840-4aba-a865-40193ed0a4aa`, progress revision 41.
- Planner ABI-036 independent-qa PASS: `evt-2208e906-2168-41c4-9554-a7f530543a02`, progress revision 43.
- Planner ABI-036 verification PASS: `evt-9042e14a-fc48-4b0a-8252-17ea54c60635`, progress revision 44.
- Planner ABI-036 manager-closure PASS: `evt-b4a822a8-dfd0-4cf1-a941-5260462ed4d5`, progress revision 46; task closure revision 47.

## Boundaries

`src/domain` remains free of Three.js and DOM concerns. `src/game/enemy-visual` owns composition and resource lifecycle; `src/game/battlefield` owns attachment/replacement/teardown; `src/debug/visual-lab` owns bounded reproducible probes. No external asset pipeline, CDN, or save-schema expansion is part of this decision.

## Related

- [[architecture/Technical Architecture|Technical Architecture]]
- [[design/Enemy Tiers and Boss Cadence|Enemy Tiers and Boss Cadence]]
- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
