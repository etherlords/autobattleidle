---
plannerFormat: 1
id: ABI-021
artifact: qa
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

# ABI-021 qa

## Verdict

PASS — independent Windows/PowerShell QA found no blockers.

## Evidence

- `pnpm hooks:install` run twice; repository-local `core.hooksPath` remained `.githooks`.
- Staged hook mode is `100755`; cached attributes are `text: set`, `eol: lf`; hook bytes contain zero CR bytes.
- `pnpm hooks:smoke` passed: autocrlf checkout, red block, green permit, unchanged index, and no commit/publication.
- `git hook run pre-commit` passed against the actual tracked hook and ran the canonical `pnpm check` only.
- Fresh `pnpm check` passed: ESLint, Prettier check, 13 test files / 71 tests, TypeScript, and production build.
- `.github/workflows/ci.yml` independently runs `pnpm check`; it is unchanged.
- Checks did not mutate the pre-existing ABI-021 worktree/index. No aliases, dependency, lockfile, or lint-config changes were added.
- Browser QA is not applicable because ABI-021 changes no application behavior. The existing Vite chunk-size warning is non-blocking and unchanged.
