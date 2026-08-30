---
plannerFormat: 1
id: ABI-029
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-022
  - ABI-023
  - ABI-026
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-029: Compose deterministic elemental enemy variants from reusable family and affinity profiles

## Goal

Compose deterministic elemental enemy variants from reusable family and affinity profiles

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] A documented affinity registry defines at least 12 named themes including Cinder, Ice, and Ash; combined with every shipped ordinary and boss family it yields at least 96 deterministic family-affinity variants without one class or mesh factory per combination.
- [ ] Every affinity has a coordinated palette, one immediately readable authored visual cue or bounded animation, and one small centralized stat modifier whose measured effect stays inside the product envelope approved by ABI-020.
- [ ] Encounter seed and canonical registries determine family, affinity, name, visuals, and stats together; reload and historical saves preserve the same identity without render-time randomness or duplicated state ownership.
- [ ] Ordinary encounters and boss encounters draw from multiple family-affinity combinations rather than repeatedly presenting Cinder Hydra, while existing grade, Golden Bug, decoration, and effect contracts remain compatible.
- [ ] The implementation reuses the ABI-023 builder/component architecture and ABI-026 semantic pose/head/side anchors; adding one affinity is one compiler-guided registry change plus authored assets, not branch edits across domain, view, and UI.
- [ ] Deterministic tests cover the full combination matrix, stat bounds, naming, save/reload stability, finite values, effect caps, reduced motion, disposal, and representative long-run distribution; pnpm check passes.
- [ ] Independent review and desktop/narrow browser QA visually inspect a representative matrix across all affinities and every family, verify readable distinction and clean console/network/resource behavior, then Manager closure proves exact-SHA CI and Pages.
- [ ] Before production geometry is implemented, representative family and boss candidates are prototyped in an interactive Visualize Three.js concept lab with all-angle orbit inspection and explicit idle, hit, and death previews.
- [ ] Only a user/design-approved concept recipe is ported into production; production reuses the installed Three.js runtime plus the existing EnemyBodyFactory, rig, animation commands, and semantic sockets, with no CDN or concept-lab runtime dependency.
- [ ] Current shipped enemy bodies remain available as legacy geometry variants; approved new bodies extend the deterministic variant set instead of replacing or silently reshaping existing variants.
- [ ] Geometry-profile selection is derived deterministically from canonical encounter seed and registries. It adds no save-schema field while identity remains reproducible from existing persisted inputs, and historical-save load/reload proof is required.

## Dependencies

- ABI-020
- ABI-022
- ABI-023
- ABI-026

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
