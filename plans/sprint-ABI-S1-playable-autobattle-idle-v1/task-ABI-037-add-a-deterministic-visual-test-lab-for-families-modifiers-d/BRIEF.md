---
plannerFormat: 1
id: ABI-037
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
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

# ABI-037: Add a deterministic visual test lab for families, modifiers, decorations, and animations

## Goal

Add a deterministic visual test lab for families, modifiers, decorations, and animations

## Work item

- Type: task
- Priority: normal
- Status: Done

## Acceptance criteria

- [ ] A developer-facing test lab enumerates every current family, grade, modifier, seed/variant, boss profile, and supported effect using the same production registries, factories, rigs, sockets, materials, and animation commands; it contains no duplicate visual definitions.
- [ ] Controls select family, grade, modifier, variant/seed, reduced-motion mode, viewport preset, and animation replay for idle, hit, critical, armor/deflect, death, spawn, reward, boss, and Golden Bug cues where applicable.
- [ ] Orbit, front/side/back/top presets, zoom bounds, responsive desktop/narrow frames, pause, single-frame stepping, replay speed, attachment/socket overlays, local/world axes, bounds, object counts, and resource counters make incorrect rotations, embedded decorations, detached sockets, and disposal leaks observable.
- [ ] The lab is isolated from production saves, leaderboard identity, network services, and gameplay progression. It never writes localStorage or mutates canonical combat state and is excluded from the normal public gameplay route unless an explicit debug build flag is set.
- [ ] A deterministic URL or fixture encoding reproduces a selected case without including secrets or user data. Invalid parameters fail to documented defaults and cannot allocate unbounded geometry or effects.
- [ ] The lab supports the ABI-029 concept workflow: candidate geometry is inspected from all angles and through animations, but only an approved recipe is ported to production. The lab itself does not become a second production renderer.
- [ ] Automated smoke coverage enumerates the full matrix for construction, finite transforms, bounds, effect caps, and idempotent disposal. Screenshot/animation acceptance remains human-visible and records exact case IDs plus state -> action/time -> visible result.
- [ ] Independent review and QA prove production parity, full-matrix boundedness, desktop/narrow usability, no save/network mutation, clean console, pnpm check, and exact-SHA Pages/debug-build behavior before Manager closure.

## Dependencies

- ABI-023
- ABI-026
- ABI-031

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-D1B235

## Constraints

- Follow the resolved workflow contract and project instructions.
