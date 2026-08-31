---
plannerFormat: 1
id: ABI-025
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
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

# ABI-025 review

## Verdict

CHANGES_REQUIRED

## Findings

### P2 — The new orbit regression uses impossible production encounters

`src/game/battlefield.test.ts:733-761` declares bosses at levels 15 and 50 and a Golden Bug at level 50. Production creates bosses only at multiples of 35 (`src/domain/combat/progression.ts:30-41`), and after defeating encounter 50 it creates a normal-grade Golden Bug for resume encounter 51 (`src/domain/combat/attacks.ts:91-106`, `src/domain/combat/progression.ts:103-118`).

The owner is deliberately keyed by enemy grade/level/modifier/Golden-Bug identity in `src/game/battlefield/lifecycle.ts:45-53,291-294`; therefore the new regression needs real 35 -> 36 -> Golden Bug 51 -> boss 70 snapshots (and the lethal test should use valid boss progression) to prove the contract at its actual domain boundary. The current all-synthetic path is green but does not meet the task's production-valid focused-lifecycle coverage requirement.

## Checks

- `pnpm vitest run src/game/battlefield.test.ts` — PASS, 13 tests.
- `pnpm check` — PASS, lint, formatting, 155 tests, Worker TypeScript, and production build.
- `git diff --check` — PASS.

## Review scope

Read the task packet, both related Vault articles, HUD/application/battlefield input and replacement paths, combat cadence, and the two-file product diff. The replacement-seam implementation itself is correctly scoped: it preserves the displayed boss during lethal frames and keeps camera state session-only. No P0/P1 runtime defect found.

## Fresh independent review — 2026-08-31

### Verdict

CHANGES_REQUIRED

### Findings

### P2 — One repaired regression still skips the required production Golden Bug transition

`src/game/battlefield.test.ts:621-622,675-677` now correctly starts with boss 35 and ordinary 36, but then renders boss 70 directly. The other repaired regression covers the full `boss 35 -> ordinary 36 -> Golden Bug 51 -> boss 70` sequence at `src/game/battlefield.test.ts:733-765`. Production generates the Golden Bug after defeating encounter 50 and resumes encounter 51 before boss 70 (`src/domain/combat/attacks.ts:91-106`; `src/domain/combat/progression.ts:103-118`), so the lethal-sequence regression must include its normal-grade Golden Bug 51 snapshot and assert its locked canonical framing before its boss-70 assertion. This is the remaining narrow fixture-only gap; the lifecycle owner remains correctly scoped at `src/game/battlefield/lifecycle.ts:291-294`.

### Fresh checks

- `pnpm vitest run src/game/battlefield.test.ts` — PASS, 13 tests.
- `pnpm check` — PASS: lint, format, 155 tests, Worker TypeScript, production build.
- `git diff --check` — PASS.
- `planner_doctor` — healthy; no recovery required.

## Exceptional fresh independent review — 2026-08-31

### Verdict

APPROVE

### Findings

No P0-P3 findings. The two focused lifecycle regressions now each use the production-valid transition `boss 35 -> ordinary 36 -> Golden Bug 51 -> boss 70` and assert canonical locked framing for the Golden Bug and a fresh canonical boss-70 camera. The lifecycle owner remains correctly scoped to `replaceEnemy`: it preserves azimuth while the defeated boss is displayed for lethal frames, then resets on an ordinary, Golden Bug, or different boss replacement.

### Fresh checks

- `pnpm vitest run src/game/battlefield.test.ts` — PASS, 13 tests.
- `pnpm check` — PASS: lint, formatting, 155 tests, Worker TypeScript, and production build.
- `git diff --check` — PASS.
- `planner_doctor` — healthy; no recovery required (one expected dirty-worktree warning).

### Review scope

Read the ABI-025 packet, the related Vault behavior/cadence articles, the complete product diff, lifecycle replacement and camera framing paths, production Golden Bug progression, and the repaired test sequences. No product code changed during this review.
