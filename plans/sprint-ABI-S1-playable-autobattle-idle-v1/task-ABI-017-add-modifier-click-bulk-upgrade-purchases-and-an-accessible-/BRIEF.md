---
plannerFormat: 1
id: ABI-017
artifact: brief
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

# ABI-017: Add modifier-click bulk upgrade purchases and an accessible modal hint

## Goal

Add modifier-click bulk upgrade purchases and an accessible modal hint

## Work item

- Type: task
- Priority: normal
- Status: Blocked

## Acceptance criteria

- [ ] HUD maps default click to quantity 1, Shift-click to 10, and Ctrl-click to 100 with Ctrl precedence when both modifiers are pressed; it emits one named request containing upgradeId and quantity rather than repeated callbacks.
- [ ] Application applies the existing pure purchaseUpgrade operation sequentially up to the requested quantity, preserving exact per-level costs and deterministic parity with repeated single purchases, and stops at the first disabled or unaffordable result.
- [ ] Each successful level keeps the existing Purchased event in successful purchase order; the first failed, disabled, or unaffordable attempt creates no event, debit, or level change. A summarized event is excluded unless separately approved.
- [ ] The completed batch renders and persists once coherently after all successful levels; partial batches expose the exact final state and event sequence and never publish an intermediate save.
- [ ] The upgrades dialog shows one compact aria-readable hint for Shift-click x10 and Ctrl-click x100 in existing spare space without redesigning the modal.
- [ ] Pointer, keyboard, focus, modal dismissal, disabled reasons, listener disposal, responsive layout, public save schema, and existing single-click behavior remain unchanged.
- [ ] Focused tests prove HUD modifier mapping, Ctrl precedence, hint/accessibility, 10/100 caps, partial stop, disabled/unaffordable identity, parity with repeated singles, successful-event count/order, zero failed-attempt event/debit, and coherent render/persistence.
- [ ] Independent review and desktop/390px browser QA pass with no modal/focus regression, followed by pnpm check and exact-SHA Pages proof.

## Dependencies

- ABI-015

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260828-ECBD82

## Constraints

- Follow the resolved workflow contract and project instructions.
