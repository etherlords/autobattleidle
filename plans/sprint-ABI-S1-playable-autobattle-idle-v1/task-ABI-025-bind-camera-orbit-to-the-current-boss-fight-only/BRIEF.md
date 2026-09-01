---
plannerFormat: 1
id: ABI-025
artifact: brief
project: ABI
profile: high-assurance
revision: 24
status: Ready for Manager
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-025: Allow camera orbit around every enemy and preserve azimuth across replacements

## Goal

Allow camera orbit around every enemy and preserve the current viewing angle across enemy replacements

## Work item

- Type: bug
- Priority: high
- Status: Ready for Manager

## Acceptance criteria

- [ ] Pointer drag, touch drag, and ArrowLeft/ArrowRight orbit the camera around every currently displayed enemy, including ordinary enemies, bosses, and Golden Bug encounters; no enemy type is locked to canonical front framing.
- [ ] The current camera azimuth is session-level battlefield presentation state and survives every visual enemy replacement: ordinary-to-ordinary, ordinary-to-boss, boss-to-ordinary, boss-to-boss, and Golden Bug entry or exit.
- [ ] Enemy defeat, spawn, profile or grade change, lethal hit/death animation, encounter-level change, and replacement never reset or snap azimuth; the next enemy appears from the same viewing angle after the existing visual handoff.
- [ ] Hits, automatic attacks, high-APS packets, resize, responsive radius/elevation changes, pause/resume, and reduced-motion mode preserve the current azimuth while continuing to frame the displayed enemy correctly.
- [ ] Azimuth resets only at an explicit battlefield/session initialization or explicit user reset; it remains presentation-only and is not added to the save schema or persisted across a full page reload.
- [ ] Stationary attack, drag-versus-click suppression, modal input isolation, keyboard accessibility, touch behavior, camera bounds, effect/death sequencing, and idempotent disposal remain unchanged.
- [ ] Focused lifecycle tests cover orbit eligibility for ordinary, boss, and Golden enemies plus continuous azimuth across every transition pair, resize, reload boundary, explicit reset, non-finite input, and disposal.
- [ ] Independent review, independent desktop/touch/keyboard browser QA, pnpm check, exact-SHA CI/Pages, and deployed ordinary-to-boss-to-ordinary-to-Golden transition proof pass before Manager closure.

## Dependencies

- ABI-016
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
