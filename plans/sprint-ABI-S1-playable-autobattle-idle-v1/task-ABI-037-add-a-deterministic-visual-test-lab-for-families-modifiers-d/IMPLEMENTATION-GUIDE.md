---
plannerFormat: 1
id: ABI-037
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-037 implementation-guide

## Frozen scope

- Developer-only production-parity visual inspection and deterministic replay. No new gameplay, content registry, save/network access, or second visual implementation.
- Reuse existing Unit/battlefield factories and commands. A build flag controls inclusion; a validated URL describes only bounded visual inputs.

## Implementation sequence

1. Define the exhaustive case schema from production registries and the normal/debug build boundary.
2. Add the smallest lab shell with selector controls, injected clock, renderer, and production visual construction.
3. Add canonical views/orbit, viewport presets, reduced motion, replay/pause/frame-step/speed, and socket/bounds/resource overlays.
4. Add deterministic case URL parsing/serialization with strict defaults and bounded effect allocation.
5. Run serial full-matrix construction/animation/disposal smoke tests and desktop/narrow human QA.
6. Complete independent review/QA, Testing Strategy Vault update, `pnpm check`, and release/debug-build proof.

## Verification matrix

- **Unit:** exhaustive registry case generation; URL validation; deterministic selection; finite transforms/bounds; cap enforcement; idempotent disposal.
- **Integration:** exact production factories/commands; no save/localStorage/network access; normal build excludes lab; debug build opens exact case IDs.
- **Visual QA:** all-angle views, idle/hit/critical/armor/death/spawn/reward/boss/Golden replay, sockets/bounds, reduced motion, desktop/narrow, repeated case replacement, clean resources/console.
