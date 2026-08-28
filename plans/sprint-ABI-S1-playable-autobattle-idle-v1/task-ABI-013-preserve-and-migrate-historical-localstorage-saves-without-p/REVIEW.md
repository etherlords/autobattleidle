---
plannerFormat: 1
id: ABI-013
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-013 review

## Verdict

### Run 1 — 2026-08-28 — independent Reviewer

**CHANGES_REQUIRED**

Target: complete `HEAD` working-tree diff for ABI-013 against the 11 acceptance criteria and repository quality rules. Reviewer was read-only and independent from implementation.

## Findings

1. **P1 — Restore overwrites valid current progress.** `hasPreviousVersionSave` shows Restore whenever V1 exists, and `restorePreviousVersion` publishes V1 migration without first requiring V2 to be missing, empty, or invalid. A valid newer V2 can therefore be replaced by stale V1 progress. Evidence: `src/persistence/persistence-boundary.ts:424`, `src/app/application.ts:187`.
2. **P2 — failed-publish retry message is false.** A failed migration `setItem` returns usable state and promises automatic retry, but does not assign `pending` or schedule/enable `flush`; pagehide has nothing to retry until an unrelated state change. Evidence: `src/persistence/persistence-boundary.ts:393,424`.
3. **P2 — golden fixtures are not consumed.** Tests recreate V1 inline and do not reference `src/persistence/fixtures/save-v1.json` or `save-v2.json`, so the committed fixtures do not prove migration/reload semantics. Evidence: `src/persistence/persistence-boundary.test.ts:136`.

## Evidence

- `pnpm check`: pass; lint, format, 16/16 Vitest, strict build, Vite build.
- Otherwise approved: V1 validation, percentage-preserving enemy mapping, startup ordering, V1 retention, V2-only reset/save, accessible status, and the narrowly scoped validation complexity suppressions.
- Missing proof: valid-V2 Restore protection, failed-bootstrap-publish retry, fixture imports, deployed browser proof.
- Elapsed: approximately 12 minutes.

### Run 2 — 2026-08-28 — independent Reviewer

**CHANGES_REQUIRED**

Target: complete `HEAD` working-tree diff for ABI-013. Read-only independent review against BRIEF, ANALYSIS, IMPLEMENTATION-GUIDE, Run 1, Persistence Contract, UI/Persistence/QA, and repository rules.

## Findings

1. **P1 — valid unversioned V2 progress is skipped when current V2 is invalid, and loses required precedence over V1.** `load` returns the fallback immediately for any non-empty invalid `SAVE_V2_KEY`, never attempting the valid compatibility V2 at `etherlords.autobattleidle.save` or V1 recovery (`src/persistence/persistence-boundary.ts:470-477`). When V2 is missing/empty, it calls V1 `migrateAndPublish` before `readLegacy`; if both retained V1 and the supplied valid unversioned V2 exist, stale V1 is published and the current legacy V2 is skipped (`src/persistence/persistence-boundary.ts:478-483`). Reproduction: invalid/non-empty V2 plus supplied legacy boss fixture starts fallback; missing V2 plus valid V1 and legacy V2 chooses V1. Smallest repair: classify V2 as valid/unusable, then direct legacy-V2 validation/import first, then V1 migration, preserving source bytes; add both priority tests.

## Run 1 repair status

- Restore protection corrected: `needsV2Repair` gates Restore, so valid V2 is not replaced (`src/persistence/persistence-boundary.ts:436-445,492-495`).
- Failed-publish retry corrected: `publish` retains encoded state and schedules existing retry (`src/persistence/persistence-boundary.ts:446-455`).
- Golden fixture consumption corrected: tests import and assert V1/V2 fixtures (`src/persistence/persistence-boundary.test.ts:1-4,140-166`).

## Evidence

- `pnpm check`: pass; ESLint, Prettier, 17/17 Vitest, strict TypeScript, Vite build; existing >500 kB chunk warning only.
- `git diff --check HEAD`: pass.
- Full `HEAD` working-tree diff inspected, including persistence, application/HUD integration, fixtures, task evidence, and Vault documentation.
- Coverage gaps: legacy-V2 test covers only absent V2/no V1 competitor; invalid-V2 test confirms fallback then manual V1 Restore; deployed browser/Pages proof remains pending.
- Read-only: no code, tests, docs, Planner/Vault, Git, or `.playwright-cli/` changes.
- Elapsed: approximately 14 minutes.

### Run 3 — 2026-08-28 — independent Reviewer

**CHANGES_REQUIRED**

Target: complete `HEAD` working-tree diff for ABI-013. Read-only independent review against task packet, both Vault contracts, prior review runs, Git V1/V2 schemas, and repository rules.

## Findings

1. **P1 — Restore can still downgrade the valid unversioned V2 save after an initial V2 publish failure.** If `SAVE_V2_KEY` is invalid and both V1 plus the supplied valid unversioned V2 exist, `load()` correctly imports unversioned V2 and attempts publish. After a transient `setItem` failure, only delayed retry remains (`src/persistence/persistence-boundary.ts:446-455`). Before retry, `hasPreviousVersionSave()` exposes Restore because V1 exists and V2 remains invalid (`src/persistence/persistence-boundary.ts:487-492`); Restore then publishes stale V1 (`src/persistence/persistence-boundary.ts:457-466,494-497`). Repro: seed valid `legacy-save-v2.json`, valid V1, invalid V2; make initial V2 write throw once, allow writes, then invoke Restore before queued retry. V1 replaces V2 and reload selects it over the retained boss-progress source. Smallest repair: suppress/deny V1 Restore while a valid unversioned V2 compatibility source exists, or make Restore import that V2 first; add this transient-publish race regression.

## Prior findings

- Run 1 Restore protection, retry scheduling, and golden-fixture consumption are otherwise corrected.
- Run 2 startup precedence is corrected for ordinary bootstrap: valid versioned V2 -> valid unversioned V2 -> V1.
- The supplied boss fixture is imported and its source bytes are preserved in the ordinary path.

## Evidence

- `pnpm check`: pass; ESLint, Prettier, 18/18 Vitest, strict TypeScript, production build; existing >500 kB chunk advisory only.
- `git diff --check`: pass.
- Historical V1/V2 source inspected at `0c66fce` and `e83ec78`; complete working-tree diff inspected.
- Specification verdict: fail. Engineering-quality verdict: partial; retry is sound in ordinary startup but Restore does not share source precedence.
- Deployed browser/Pages proof remains pending; no `.playwright-cli/` access or mutations.
- Elapsed: approximately 12 minutes.

### Run 4 — 2026-08-28 — independent Reviewer

**APPROVE**

Target: complete `HEAD` working-tree diff for ABI-013 after the Run 3 P1 repair. Reviewer was independent and read-only; reviewed task acceptance, AGENTS, all prior review runs, canonical Vault contracts, authentic Git V1/V2 schemas (`0c66fce`, `e83ec78`), complete working-tree diff, and test evidence.

## Findings

No P0–P3 findings.

## Prior-finding verification

- Run 1: valid-V2 Restore protection remains enforced by `needsV2Repair`; failed publication retains the encoded V2 payload and schedules bounded retry; V1/V2 fixtures are imported and asserted.
- Run 2: source precedence is valid versioned V2, then valid legacy unversioned V2, then V1 migration.
- Run 3: bootstrap and Restore now share `readRepairSource`, which selects valid legacy V2 before V1. The exact invalid-V2 + valid legacy-V2 + valid V1 + first-write-failure + Restore-before-retry regression preserves legacy-V2 authority and the raw V1/legacy source bytes.

## Evidence

- `src/persistence/persistence-boundary.ts:446-497`: validated versioned-V2 load, shared legacy-V2/V1 source selection, safe publication/retry, and repair-only Restore.
- `src/persistence/persistence-boundary.test.ts:140-308`: authentic V1/V2 fixture consumption, supplied boss-save import, source precedence, failed-publish retry, and Run 3 race coverage.
- `src/app/application.ts:80-101`: persistence resolves before battlefield, HUD, render loop, or autosave setup.
- `src/ui/hud.ts:43-51,136-143`: native Restore button and polite accessible status.
- `pnpm check`: pass — ESLint, Prettier, 19/19 Vitest tests, strict TypeScript, Vite production build. Existing >500 kB chunk advisory only.
- `git diff --check HEAD`: pass.
- Canonical Vault contracts read directly: `AUTOBATTLEIDLE-DOC-20260827-E27CD3` and `AUTOBATTLEIDLE-DOC-20260827-85CBFC`; native Vault MCP was not exposed in reviewer context.
- Deployed browser/Pages proof remains pending independent QA and manager-release gates; it is not a code-review failure.
- Read-only: no repository, Planner, Vault, Git, or `.playwright-cli/` mutation.
- Elapsed: approximately 24 minutes.
