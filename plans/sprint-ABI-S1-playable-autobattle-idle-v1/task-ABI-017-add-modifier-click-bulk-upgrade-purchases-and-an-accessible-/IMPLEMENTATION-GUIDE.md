---
plannerFormat: 1
id: ABI-017
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-017 implementation-guide

## Frozen scope

- Own only modifier-click bulk upgrade purchasing and its compact accessible hint.
- Preserve balance, costs, pure `purchaseUpgrade`, public save V2 shape, pointer/keyboard/focus/dismissal behavior, disabled reasons, responsive layout model, and listener ownership.
- Exclude summarized batch events, modal redesign, new dependencies, and ABI-018+ behavior.

## Implementation sequence

1. Update the HUD intent and `UpgradeDialog` listener contract to carry `{ upgradeId, quantity }`; Ctrl takes precedence over Shift.
2. Add the compact aria-readable hint in existing dialog space and preserve listener cleanup.
3. Add the smallest controller/application batch seam that applies existing single-level purchase logic sequentially and publishes once after successes.
4. Add focused HUD, controller/application, and persistence regression tests; run `pnpm check`.

## Verification matrix

- **Unit:** default/Shift/Ctrl/both mapping; keyboard default; 10/100 cap; stop-on-first-failure; exact state parity; successful event count/order; no failed-attempt event/debit.
- **Integration:** one HUD request per activation; one controller publication, render, and persistence notification for a complete or partial successful batch; zero publication for a wholly failed batch; disposal remains idempotent.
- **Persistence:** no schema change; load and reload supported historical V1/V2 fixtures without semantic loss.
- **Browser/deployed:** desktop and 390px modal hint/readability, focus trap/restore, Escape/backdrop/U dismissal, single/Shift/Ctrl purchase results, reload persistence, no console errors or page scroll, exact deployed SHA.
