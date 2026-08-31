---
plannerFormat: 1
id: ABI-032
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-013
  - ABI-030
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-032 review

## Verdict

CHANGES_REQUIRED — fresh independent review after the Drizzle refactor.

## Findings

1. **P1 — success does not reset the five-minute window.** A boss-triggered successful submission
   leaves the existing timer active. A later dirty metric can therefore submit before five minutes
   have elapsed from that success. Clear and reschedule the timer on every successful acknowledgement.
2. **P1 — direct scheduler proof is missing.** Add fake-time tests for five-minute submit, successful
   reset, failure retention/backoff, one-in-flight coalescing, boss queued while in flight, and disposal.
3. **P2 — Golden Bugs Worker ranking proof is missing.** Add independent-maxima plus Golden Bugs Top
   and Around Me tie-order tests.

Typed Drizzle `sql` fragments inside repositories are accepted by the frozen implementation guide;
the prohibited boundary is direct D1/raw SQL outside repositories and HTTP/use-case layers.

## Evidence

- `pnpm check`: passed, 19 files / 141 tests before the repair.
- `git diff --check HEAD`: passed.
- Pinned Wrangler 4.127.1 local `0001 -> 0002`: passed in isolated state.
- Production Worker has no direct `env.DB.prepare`; handler/service/repository boundaries are present.
- Local API smoke was inconclusive because the review process could not inject the allowed-origin
  value into isolated `wrangler dev`; deployment QA remains required.

## Fresh re-review

PASS — no remaining findings after the bounded repair.

- Boss-triggered success now clears and restarts the five-minute window.
- Direct fake-time tests cover timed and boss sends, success reset, failure retry, one-in-flight
  coalescing, queued boss follow-up, disposal, and ordinary-change no-spam behavior.
- Worker tests cover independent maxima and deterministic Golden Bugs Top/Around ranking.
- Drizzle boundaries remain intact with no direct production `env.DB.prepare`.
- `pnpm check` passed 20 test files / 147 tests; `git diff --check` passed.
