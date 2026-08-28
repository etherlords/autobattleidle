---
plannerFormat: 1
id: ABI-004
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004 review

## Verdict

CHANGES_REQUIRED — first independent review. One bounded repair/re-review cycle authorized.

## Findings

1. **P2 — listener disposal:** `src/ui/hud.ts` registered five anonymous upgrade click handlers but
   `dispose()` removed only the attack handler. Retain and remove every handler.
2. **P2 — active auto-speed cooldown:** the speed purchase changed the reported interval while leaving
   the current deadline on the old schedule. Recompute the active deadline from purchase time using
   the new interval.
3. **P2 — integration proof:** tests did not exercise native HUD click/keyboard activation, visible HP
   changes from a due automatic attack, reward/log updates, five disabled states, or HUD disposal.

## Evidence

- Independent actor: `autobattle-reviewer-abi004`
- `git diff --check`: PASS
- `pnpm vitest run src/domain/combat.test.ts src/app/application.test.ts`: PASS, 2 files / 9 tests
- `pnpm check`: PASS; existing Vite chunk-size advisory only
- Scope: no ABI-003 visual or ABI-005 persistence expansion
- Elapsed: approximately 8 minutes

## Re-review

CHANGES_REQUIRED — the single bounded re-review confirmed that listener cleanup and active speed-deadline
recalculation are fixed. The third finding remains: there is no focused `createHud` test proving native
pointer/keyboard exactly-once activation, event-log rendering, and real HUD listener removal. The slow
elite plus speed-reschedule combination is also not covered.

- `git diff --check`: PASS
- Focused Vitest: PASS, 2 files / 9 tests
- `pnpm check`: PASS; existing chunk-size advisory only
- No ABI-003/ABI-005 scope expansion
- Re-review elapsed: approximately 5 minutes

## Final independent review

PASS — after the user-authorized proof repair and evidence correction. The focused HUD test now proves
the application-owned contract only: a native `button type="button"` has one click handler, one click
causes one attack, the bounded event log renders, and attack plus all five upgrade listeners are removed
by `dispose()`. Real Enter/Space exactly-once activation is deliberately reserved for independent browser
QA instead of being falsely simulated by the test-local fake DOM.

The slow-elite speed purchase reschedules the active automatic deadline from purchase time using the new
slow-modified interval, and the following manual attack leaves that deadline unchanged. Listener cleanup
is complete. No ABI-003 visual or ABI-005 persistence scope expansion was found.

- Independent actor: `autobattle-reviewer-abi004`
- `git diff --check`: PASS
- Focused Vitest: PASS, 3 files / 11 tests, 0.246 seconds
- `pnpm check`: PASS, approximately 7.2 seconds; existing Vite chunk-size advisory only
- Final re-review elapsed: approximately 5 minutes
