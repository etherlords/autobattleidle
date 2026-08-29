---
plannerFormat: 1
id: ABI-021
artifact: analysis
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

# ABI-021 analysis

## Verified current state

- Fresh fetch proves `HEAD == origin/main == 6d81fd47a03a588824340fd9f3ea2b6a58e3435e`; the worktree was clean before ABI-021 state writes.
- Planner MCP package source is installed at version 1.1.2. Planner doctor is healthy with zero findings and no recovery; Vault doctor has zero findings; ABI-021 had no live lease.
- `planner_next_task` selected ABI-021. It is the only dependency-clear high-priority Ready task; ABI-015 and ABI-023 are Done.
- `pnpm check` is the single canonical gate and freshly passes: ESLint, Prettier check, 13 test files / 71 tests, TypeScript, and the Vite production build.
- CI already runs `pnpm check` independently on pushes to `main` and pull requests. `core.hooksPath` is currently unset.
- Installed ESLint/TypeScript rules already cover the reliable zero-baseline architecture rules: strict typing, named boundaries, nested ternaries, indexed-access contracts, double assertions, complexity/depth, layer direction, root composition, class ownership, and avoidable branches.
- Production imports use at most two `../` segments (40 imports); this does not meet the documented alias threshold.

## Approach

- Add one tracked native pre-commit hook whose only gate command is `pnpm check`.
- Add one dependency-free, idempotent package-script installer that sets repository-local `core.hooksPath` to `.githooks`.
- Add one isolated smoke that copies the hook into a temporary Git repository, substitutes only the `pnpm` executable, and proves red blocks / green permits without creating a commit or publication.
- Document install, bypass/CI independence, and explicit repair/stage/retry commands.
- Keep the existing ESLint configuration and relative imports unchanged.

## Risks

- Git for Windows executes native hooks through its POSIX shell; the hook must use portable `sh` syntax and LF line endings.
- A developer may bypass the hook with `--no-verify`; CI remains the independent publication gate.
- Hook failure must not mutate staged files. Repair remains explicit: run `pnpm check`, optionally `pnpm format`, stage changes, retry.
- Persistence impact: no schema change. The canonical test suite retains historical save load/migrate/reload coverage.
