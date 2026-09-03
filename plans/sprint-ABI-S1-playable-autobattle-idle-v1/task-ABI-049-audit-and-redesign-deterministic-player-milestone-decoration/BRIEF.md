---
plannerFormat: 1
id: ABI-049
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-048
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-049: Audit and redesign deterministic player milestone decorations

## Goal

Audit and redesign deterministic player milestone decorations

## Work item

- Type: task
- Priority: critical
- Status: Done

## Acceptance criteria

- [ ] A real browser visual audit records current player decoration failures at representative milestone levels, views, desktop and narrow layouts, including the floating-ring/orbital marker and its placement.
- [ ] Replace the current ambiguous milestone ring with an authored, readable progression of deterministic badges/details: early small overhead marker, nested intermediate badge, and more structured later form; each boundary is visibly distinct and communicates progression without random placement.
- [ ] Decoration identity and placement derive only from the canonical player level/milestone selector and stable player sockets; no render-time randomness, level-only position jumps, or unrelated default fallback remains.
- [ ] Production PlayerUnit and Visual Lab show the same decoration identity, with stable attack/aura sockets, animation, reduced-motion, clearance, camera framing, and exact disposal preserved.
- [ ] Object, geometry, material, draw-call, texture, and lab-case counts remain explicitly bounded; persistence remains no schema change and supported historical V1-V4 saves reload without progress loss.
- [ ] Focused deterministic tests and real-browser QA prove milestone boundaries, all-angle readability, desktop/narrow framing, reduced motion, high-APS animation, replacement, disposal, and clean console; independent review/QA and exact-SHA deployment proof pass.

## Dependencies

- ABI-048

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-D1B235

## Constraints

- Follow the resolved workflow contract and project instructions.
