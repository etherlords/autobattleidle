---
plannerFormat: 1
id: ABI-021
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

# ABI-021 verification

## Acceptance evidence

- Native hook: `.githooks/pre-commit` is tracked as executable mode `100755`, forced to LF, and invokes only `pnpm check`.
- Installation: `pnpm hooks:install` is dependency-free, repository-local, and idempotently sets `core.hooksPath=.githooks` on Windows PowerShell/Git.
- Failure behavior: isolated `core.autocrlf=true` smoke proves a failing fake `pnpm check` blocks, a passing one permits, the index is unchanged, and no commit/publication is created.
- Repair behavior: the hook prints `pnpm check`, optional `pnpm format`, explicit staging, and retry guidance; it never formats or stages files.
- Canonical gate: fresh implementation and QA runs of `pnpm check` pass ESLint, Prettier check, 13 test files / 71 tests (including historical-save coverage), TypeScript, and production build.
- CI independence: `.github/workflows/ci.yml` independently runs `pnpm check` for pushes to `main` and pull requests; the workflow is unchanged.
- Architecture enforcement: installed ESLint/TypeScript rules already cover all reliable zero-baseline AST rules; no scanner, dependency, lockfile, alias, or lint-config change was added.
- Alias decision: keep relative imports; measured production traversal is at most two parent segments. Reconsider only with repeated deeper paths, measured friction, shared TypeScript/Vite/Vitest mapping, and preserved layer lint.
- Vault: `AUTOBATTLEIDLE-DOC-20260828-ECBD82` synchronized at content hash `6f087dc6440941f630f1c2b0c8453ab55d6f7f020899929e2d64aa2911661ff0`; Vault doctor/index are clean.
- Publication receipt: pending the coherent implementation checkpoint and exact-SHA CI/Pages readback.

## Sign-off

- Reviewer: PASS after one bounded checkout-portability repair and fresh re-review
- QA: PASS on Windows installer, isolated and actual hook paths, canonical check, and CI independence
- Manager close: pending
