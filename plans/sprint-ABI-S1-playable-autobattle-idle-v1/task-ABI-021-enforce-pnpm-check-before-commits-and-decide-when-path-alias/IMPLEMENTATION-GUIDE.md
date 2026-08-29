---
plannerFormat: 1
id: ABI-021
artifact: implementation_guide
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

# ABI-021 implementation-guide

## Frozen scope

- Tracked `.githooks/pre-commit`, a repository-local idempotent installer, an isolated cross-platform smoke, and concise developer documentation.
- The hook invokes only `pnpm check`; it never formats, stages, commits, or publishes.
- CI remains unchanged and independently runs `pnpm check` for `main` and pull requests.
- No dependency, custom scanner, path alias, TypeScript/Vite/Vitest resolution change, gameplay change, or save-schema change.

## Implementation sequence

1. Add the portable native hook and installer using existing Git, Node, pnpm, and package scripts only.
2. Add the isolated smoke for failing and passing fake `pnpm check` results; assert no commit is created.
3. Document install, verification, bypass boundary, and repair/stage/retry commands.
4. Run the smoke and `pnpm check`; record fresh evidence.
5. Run independent review, bounded repairs if required, independent QA, Vault synchronization, and Manager closure.

## Verification matrix

- Integration: installer is idempotent and `git config --local --get core.hooksPath` returns `.githooks` in an isolated repository.
- Integration: a failing fake `pnpm check` makes `git hook run pre-commit` non-zero; a passing fake makes it zero; neither path creates a commit.
- Unit/integration: `pnpm check` proves existing strict TypeScript, ESLint, Prettier, focused tests (including historical-save regression), and production build.
- Review: inspect the hook for portable syntax, no staged-file mutation, clear repair commands, and no alias/lint overreach.
- Deployed: exact pushed SHA has a successful independent CI receipt; Pages proof may be unchanged-health proof because ABI-021 changes no application behavior.
