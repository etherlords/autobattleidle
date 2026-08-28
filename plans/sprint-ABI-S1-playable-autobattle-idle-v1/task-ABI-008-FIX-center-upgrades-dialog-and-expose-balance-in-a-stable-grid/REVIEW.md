---
plannerFormat: 1
id: ABI-008-FIX
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008-FIX review

## Verdict

APPROVED — independent review run 2 after one bounded P2 repair; no P0-P3 findings.

## Findings

- P2: `src/style.css` uses only `min-height` for upgrade buttons. Because `src/ui/hud.ts` combines dynamic label, level, cost, and disabled reason, wrapping can grow a grid row and change the control/card layout at desktop or 390px.
- Required root repair: use fixed grid-row/button heights with a bounded internal text-overflow strategy and add a long dynamic label/cost/reason regression assertion.
- No other P0-P3 findings. Backdrop/hidden behavior, role and `aria-modal` placement, snapshot-owned in-modal coins, focus/input/disposal paths were correct.
- Evidence: independent focused Vitest 4/4; `git diff --check 971212d --` passed; reviewer made no mutations.

### Run 2

- APPROVED: fixed desktop/narrow grid rows, full-height buttons and ellipsis prevent dynamic strings from resizing the layout; the full action text remains the accessible name and `title`.
- Centered bounded dialog, in-modal balance, native hidden semantics, focus/input/disposal behavior remain correct.
- Independent focused Vitest 4/4 and `git diff --check 971212d --` passed; reviewer made no mutations.

### Run 3

- APPROVED after user-feedback revision; no P0-P3 findings in the full `d113abc...working-tree` diff.
- Every action has exactly two fixed visual rows (`TITLE - LEVEL`, then `PRICE coins`); disabled reason is absent visually and retained in `aria-label`/`title`.
- Global U/u toggle rejects repeats, cannot attack, restores launcher focus and disposes its listener. Backdrop dismissal is target-guarded, so card/control input neither closes nor leaks.
- Native hidden behavior, Escape/Close and focus trap remain intact. Independent focused Vitest 4/4 and `git diff --check d113abc --` passed; reviewer made no mutations.
- ABI-012 change is acceptance-only for future compact modal-balance and price formatting; no ABI-012 implementation was added.
