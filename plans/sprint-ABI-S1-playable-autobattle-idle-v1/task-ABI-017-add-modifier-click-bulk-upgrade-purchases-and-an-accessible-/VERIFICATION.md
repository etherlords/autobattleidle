---
plannerFormat: 1
id: ABI-017
artifact: verification
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

# ABI-017 verification

## Acceptance evidence

- Planner selected ABI-017 uniquely with ABI-015/ABI-023 Done and no foreign lease; JIT preflight classified `no schema change` and froze unit/integration/browser/deployed proof.
- HUD emits one `{ id, quantity }` intent: pointer default x1, Shift x10, Ctrl x100 with Ctrl precedence; modifier-held keyboard activation remains x1. The compact hint is visible and aria-readable.
- Controller reuses pure `purchaseUpgrade` sequentially, stops at the first failure, preserves ordered successful events within the six-event bound, and publishes no failed-attempt event/debit/state change.
- Non-empty complete/partial batches produce exactly one controller publication, battlefield render, HUD render, and persistence callback. Save V2 shape and balance are unchanged.
- Implementation self-check: `pnpm check` 73 tests plus lint, format, TypeScript, build; `git diff --check` pass.
- Independent review: first review failed keyboard modality/proof; one bounded repair and fresh re-review passed with no P1-P3 findings.
- Independent QA: real browser desktop and 390x844 passed functional modifier flows, partial stop, keyboard x1, hint/accessibility, focus/dismissal, responsive overflow, V2 reload, and zero console issues; deterministic persistence tests cover V1/V2 and malformed saves.
- Vault `AUTOBATTLEIDLE-DOC-20260827-85CBFC` is synchronized to accepted behavior; Vault status is fresh and doctor reports zero findings.
- Exact commit SHA, GitHub CI/Pages receipts, and deployed URL proof are appended during Manager closure after publish.

## Sign-off

- Reviewer: PASS — independent re-review
- QA: PASS — independent browser/regression QA
- Verification: PASS — manager-verifier
- Manager close: pending exact-SHA publish/deployed proof
