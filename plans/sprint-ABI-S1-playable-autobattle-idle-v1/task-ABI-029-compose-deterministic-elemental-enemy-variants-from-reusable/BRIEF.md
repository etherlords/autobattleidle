---
plannerFormat: 1
id: ABI-029
artifact: brief
project: ABI
profile: high-assurance
revision: 9
status: In Progress
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-022
  - ABI-023
  - ABI-026
  - ABI-028
  - ABI-037
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
- Status: In Progress

## Acceptance criteria

- [ ] A compiler-checked affinity registry defines at least 12 named themes including Cinder, Ice, and Ash; combined with every shipped ordinary and boss family it yields at least 96 deterministic family-affinity identities without one class or mesh factory per combination.
- [ ] Every affinity has a coordinated palette, readable bounded cue, and one centralized measured stat modifier inside ABI-020/ABI-028 envelopes; encounter seed determines family, affinity, name, visuals, and stats together.
- [ ] The Crystal Crown, Elemental Spines, and Orbital Runes geometry recipes are boss-only. Ordinary enemies keep meaningful non-intersecting palette/cue treatment and never receive these generic boss attachments.
- [ ] Crystal Crown floats above the complete boss silhouette and clears native crowns/heads on Hydra and Colossus.
- [ ] Elemental Spines uses about 15-20 individual spikes distributed across the boss body surface with directions pointing outward; Hydra has no three-spike cluster over its central crowned head.
- [ ] Orbital Rune placement remains bounded; each ring rotates like a wheel around its own axis rather than orbiting the entire body.
- [ ] Hydra and Colossus receive explicit all-angle idle/hit/death, reduced-motion, bounds, socket, responsive-camera, and disposal proof before production porting.
- [ ] Current shipped bodies remain available as legacy variants; approved recipes extend rather than replace them. Golden Bug, grade, modifier, effect, and boss contracts remain distinct and compatible.
- [ ] Identity reconstructs deterministically from existing persisted inputs with no save-schema field; current and historical saves reproduce the same identity after load/save/reload.
- [ ] Deterministic tests cover registry completeness, stat bounds, names, full identity matrix, distribution, finite resources, effect caps, reduced motion, exact disposal, and pnpm check.
- [ ] Independent review and desktop/narrow deployed browser QA inspect the risk-based representative matrix, including every affinity and both boss families, with clean console/network/resources.
- [ ] Only the user-approved boss-only recipes are ported through existing EnemyBodyFactory, rig, animation commands, semantic sockets, and disposal ownership; the lab remains a debug route, not a production dependency.

## Dependencies

- ABI-020
- ABI-022
- ABI-023
- ABI-026
- ABI-028
- ABI-037

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
