---
plannerFormat: 1
id: ABI-008
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008 review

## Verdict

APPROVED — fresh independent re-review after the bounded repair found no P0-P3 findings.

## Findings

- P3 — `src/ui/hud.test.ts` proves Enter and rejected repeating Space, but not one accepted non-repeating Space activation. It opens the modal and closes with Escape, but does not exercise the explicit Close control/focus restoration or disposal while the document modal key listener is active.
- Required repair: add focused assertions for accepted Space, Close click with launcher focus restoration, and dispose-with-modal-open listener cleanup. Production behavior was otherwise approved for scope, ownership, listener removal, modal layering, and no ABI-009/ABI-014/persistence/domain changes.

## Evidence

- Reviewer: `autobattle_reviewer`, independent from implementation.
- Baseline: `6566aa33fcf67cc81c720630e32673d3db6d132d` complete working-tree diff.
- Checks: focused Vitest 3/3; `pnpm check` 19/19; `git diff --check` PASS.
- Vault: `AUTOBATTLEIDLE-DOC-20260827-85CBFC` HUD/input contract and `AUTOBATTLEIDLE-DOC-20260827-584401` runtime-loop contract.

## Re-review

- The same independent Reviewer verified accepted non-repeating Space exactly once, explicit Close focus restoration, and disposal with the modal open removing the document key listener.
- Fresh checks: focused Vitest 3/3; `git diff --check 6566aa3 --` PASS; prior post-repair `pnpm check` 19/19 remains current.
- Full diff remains ABI-008-only with no production changes in the repair and no domain, persistence, ABI-009, ABI-014, dependency, Git, output, or `.playwright-cli` drift.

## QA repair re-review

- The same independent Reviewer approved the shared CSS repair `.upgrades-modal[hidden] { display: none; }`: native hidden presentation now wins over flex layout and `hud.ts` retains one `modal.hidden` state owner.
- The typed `?raw` stylesheet assertion runs through `test.css: true`; no ignored TypeScript errors or Node shims remain.
- Fresh focused tests passed 4/4 and `git diff --check 6566aa3 --` passed. No P0-P3 findings or scope drift.
