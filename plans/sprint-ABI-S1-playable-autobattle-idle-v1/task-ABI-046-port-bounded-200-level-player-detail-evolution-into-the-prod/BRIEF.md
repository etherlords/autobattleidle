---
plannerFormat: 1
id: ABI-046
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-038
  - ABI-045
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-046: Port bounded 200-level player detail evolution into the production PlayerUnit

## Goal

Port bounded 200-level player detail evolution into the production PlayerUnit

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] Derive production player visual identity from canonical progression with no save-schema field; historical V1-V4 saves load, render, save, and reload without losing progress.
- [ ] Use the ABI-045 decision: one visible transition detail every 200 levels, at most four live transition details, then replace the whole authored form at the endpoint.
- [ ] Keep the major-form catalogue explicitly finite; do not author or allocate a new major mesh for every literal 1000 levels.
- [ ] Port only approved existing ABI-038 authored forms and the bounded transition through the existing PlayerUnit view/sync/disposal ownership; combat stats, scheduling, rewards, leaderboard, and input remain unchanged.
- [ ] Preserve attack/aura sockets, high-APS presentation, hit/attack cues, boss camera, desktop/narrow framing, reduced motion, and exact geometry/material disposal across repeated transitions.
- [ ] Add deterministic boundary, historical-save, reload-equivalence, resource-ceiling, and production browser tests; independently review and QA the deployed result.

## Dependencies

- ABI-038
- ABI-045

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-D1B235

## Constraints

- Follow the resolved workflow contract and project instructions.
