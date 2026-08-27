---
plannerFormat: 1
id: ABI-001
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies: []
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-001 review

## Verdict

CHANGES_REQUIRED — 2026-08-27 UTC, independent `autobattle_reviewer`.

## Findings

- P2 manager workflow: `.agents/AGENTS.md` required a preflight-ready managed plan and then delegated
  implementation without mandating the `Ready -> In Progress` Planner advance/readback. ABI-001 had
  correctly performed that advance (`evt-7bc949a0-f218-44d7-9634-47b27e64e517`), but the durable guide
  could repeat the earlier pilot mismatch. Repair the manager-owned workflow and repeat independent review.

## Review evidence

- No product-code defect found. `src/main.ts` is the only composition root; module ownership is clean:
  deterministic domain has no DOM/Three imports, Three.js remains in `src/game`, DOM stays in `src/ui`,
  persistence is isolated, and `src/app` owns the frame lifecycle.
- `src/app/application.ts` cancels its frame, removes the resize listener, disposes each subsystem, and
  makes teardown idempotent. Its focused Vitest proof asserts those properties.
- `pnpm check` passed: ESLint, Prettier, Vitest (1/1), strict TypeScript, and Vite build. `git diff --check`
  passed. Vite emitted only a non-blocking 523.82 kB chunk advisory.
- `@types/three` is required because the installed Three package lacks declarations. `.playwright-cli` was
  not modified; `.prettierignore` excludes that user-owned untracked directory from formatting traversal.
- Reviewer used no Planner/Vault mutations; direct reads were the complete ABI-001 diff, task artifacts,
  project rules, and cited Vault architecture. QA was pending. Elapsed review time: about 15 minutes.

## Fresh independent re-review

APPROVE — 2026-08-27 UTC, independent `autobattle_reviewer`; no P0-P3 findings after the single repair.

- The canonical flow now explicitly requires exact-live-revision `Ready -> In Progress`, a canonical
  readback, and only then implementation delegation. It preserves a Ready preflight as a warning, not
  implementation permission.
- ABI-001 itself follows that order: the preflight/plan evidence precedes lifecycle event
  `evt-7bc949a0-f218-44d7-9634-47b27e64e517`, which precedes worker work.
- Re-review reconfirmed one composition root, clean module ownership, focused idempotent lifecycle proof,
  strict TypeScript, `pnpm check` PASS, and `git diff --check` PASS. The Vite 523.82 kB chunk advisory is
  non-blocking. `.playwright-cli` remains untracked and untouched.
- Tools: read-only Planner (`planner_get_current`, `planner_tasks_list`, `planner_activity_list`) and
  Vault (`vault_get_article`); no mutations. Direct reads: complete ABI-001 packet/diff, all new source
  modules, rules, package config, and Vault architecture. Elapsed: about 15 minutes. QA remains pending.
