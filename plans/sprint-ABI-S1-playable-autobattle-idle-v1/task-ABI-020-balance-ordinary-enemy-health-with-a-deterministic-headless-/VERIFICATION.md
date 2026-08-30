---
plannerFormat: 1
id: ABI-020
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-020 verification

## Acceptance evidence

- BLOCKED before an accepted implementation. The deterministic production-path attempt was measured, failed the frozen envelopes, and was fully reverted; `git diff --exit-code -- src` is clean.
- Baseline proof: encounter 2 has 210 HP, initial automatic combat deals 1 damage at 0.1 APS (10,000 ms interval), so automatic-only TTK is `210 * 10,000 = 2,100,000 ms` = 2,100 seconds = 35 times the frozen 60-second cap. Either allowed 0.5%/0.8% health candidate raises encounter 2 to 212 HP and 2,120 seconds.
- Economy proof: the initial coin buys automatic unlock; the encounter-1 reward restores only one coin; the cheapest repeatable damage upgrade costs two. No pre-encounter-2 purchase bridges the gap. Even the first damage upgrade would deal 12 and require 180 seconds for 212 HP.
- Candidate telemetry showed that increasing damage enough to address late walls simultaneously destroyed the required hit-distribution envelopes: band 100-150 became 100% one-hit with 0% five-/ten-plus-hit; band 1000-1100 became 95% one-hit with 0% five-/ten-plus-hit. No candidate was accepted or published.
- Implementation worker self-check: focused 43/43 and full `pnpm check` 14 files / 90 tests were green on the attempted candidate; after complete source/test revert, baseline `pnpm check` passed 14 files / 89 tests, lint, format, TypeScript, and build.
- Independent Reviewer verdict: `APPROVE_BLOCKER`; detailed source evidence and product options are in `REVIEW.md`. Planner gate `implementation-self-check` is canonically `blocked` at event `evt-26c274bb-eb63-48d5-b142-f75bc274bd0a`.
- Product decision required before resume: exempt/bootstrap initial encounters from the 60-second wall, explicitly authorize a new early-game health/grant/start-stat exception, or revise the automatic-only reference/TTK criterion.

## Sign-off

- Reviewer: APPROVE_BLOCKER; independent review gate could not be recorded because the workflow correctly requires a passing implementation-self-check first.
- QA: not run; implementation acceptance is blocked before QA and no candidate remains.
- Manager close: task will remain Blocked; no commit, push, CI/Pages, deployment, Vault formula sync, or Done closure is authorized for a failed candidate.
