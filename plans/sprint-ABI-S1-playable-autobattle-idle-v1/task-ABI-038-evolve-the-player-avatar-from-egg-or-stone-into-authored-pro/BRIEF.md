---
plannerFormat: 1
id: ABI-038
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-023
  - ABI-026
  - ABI-037
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-038: Evolve the player avatar from egg or stone into authored progression forms

## Goal

Evolve the player avatar from egg or stone into authored progression forms

## Work item

- Type: task
- Priority: normal
- Status: Blocked

## Acceptance criteria

- [ ] Product preflight defines a small approved sequence of readable player forms beginning with an egg/stone-like core and gaining authored silhouette, material, appendage, aura, and animation complexity at measured progression milestones; no speculative inventory or customization system is added.
- [ ] Milestones derive deterministically from existing canonical progression/player stats and the ABI-020 elapsed-time stages. Reload-equivalent state always selects the same form without a new save field unless preflight proves derivation insufficient and supplies a versioned migration.
- [ ] Representative forms are prototyped in the visual lab and accepted from front, side, back, top, desktop/narrow framing, and idle/hit/attack states before production porting.
- [ ] Production reuses the existing PlayerUnit model/view/controller ownership and named component roots. Form changes synchronize at one replacement seam, preserve current input/camera behavior, and dispose old geometry/materials exactly once.
- [ ] Each milestone changes more than color: the silhouette and at least one bounded animation or semantic detail visibly evolve. Transitions avoid popping through a documented short presentation handoff without changing combat timing.
- [ ] Player evolution never changes damage, APS, rewards, enemy selection, leaderboard score, or persistence semantics unless a separately approved balance task explicitly does so.
- [ ] Reduced-motion, high APS, resize, boss orbit, pause, reset, current and historical saves, long progression, finite transforms, object budgets, and WebGL resource disposal remain supported.
- [ ] Focused tests prove milestone boundaries, deterministic reload identity, component ownership, transition lifecycle, reduced motion, and disposal. Browser QA proves every form at representative milestones and exact state -> action/time -> visible result.
- [ ] Independent review, independent QA, pnpm check, exact-SHA CI/Pages, deployed historical-save proof, and Manager closure pass.

## Dependencies

- ABI-020
- ABI-023
- ABI-026
- ABI-037

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
