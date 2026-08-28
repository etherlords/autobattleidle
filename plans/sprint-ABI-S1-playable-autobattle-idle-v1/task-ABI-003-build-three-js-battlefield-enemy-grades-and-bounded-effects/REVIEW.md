---
plannerFormat: 1
id: ABI-003
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-003 review

## Verdict

APPROVE — independent re-review after repair, 2026-08-28.

## Findings

### P2 — effect cap can suppress required transition feedback

`src/game/battlefield.ts` slices new effects against the remaining 12-slot capacity. With 11 active
hit effects, a kill into a boss derives spawn, boss, and death but retains only spawn. Required death
and boss feedback must not be dropped; retire older effects or reserve capacity for transition cues
and add a regression test.

### P2 — deterministic scene cleanup is incomplete and untested

`dispose()` releases geometry/materials but does not remove or clear scene children. A retained disposed
battlefield therefore retains player, enemy, effects, lights, and ground through the scene closure.
The focused tests exercise only pure mapping/transition helpers and never construct, render, expire,
replace, or dispose a battlefield. Add the smallest renderer/scene seam that proves bounded counts,
replacement/expiry disposal, scene clearing, renderer removal, and idempotent final disposal.

## Positive evidence

- Snapshot-only rendering remains intact and adds no RAF/listener.
- Four silhouettes and non-color-only elite modifier/boss cues are present.
- No ABI-005 persistence or ABI-006 balance scope expansion.
- Focused tests: 2/2 PASS. `pnpm check`: 4 files/13 tests PASS; existing bundle advisory only.

## Repair and re-review

- The effect admission path now evicts and disposes the oldest effects before adding the complete
  transition set. Eleven active effects plus spawn/boss/death evicts two and retains all three required
  cues within the cap of twelve.
- `dispose()` now clears the scene graph after disposing its geometry/materials and remains idempotent;
  renderer disposal and canvas removal occur once.
- The renderer seam test constructs a real Three.js scene and proves enemy replacement disposal,
  effect expiry disposal, empty scene children after final disposal, and one-time renderer/canvas cleanup.
- Fresh re-review found no remaining P0-P3 findings. Focused tests: 3/3 PASS. `pnpm check`: 4 files/14
  tests PASS; existing bundle advisory only.
