---
plannerFormat: 1
id: ABI-021
artifact: brief
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

# ABI-021: Enforce pnpm check before commits and decide when path aliases are justified

## Goal

Enforce pnpm check before commits and decide when path aliases are justified

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] A tracked native Git pre-commit hook runs the single canonical pnpm check command and blocks a commit unless strict TypeScript, ESLint, Prettier check, focused tests, and production build all pass.
- [ ] The hook adds no third-party hook dependency and has one documented idempotent installation path that configures core.hooksPath for this repository, with Windows PowerShell/Git and CI-safe smoke proof.
- [ ] The hook never auto-formats or silently changes staged files; failure prints the canonical repair commands, and the developer explicitly fixes/formats, stages, and retries.
- [ ] CI continues to run the same pnpm check independently so bypassing hooks with --no-verify cannot publish an unchecked main commit.
- [ ] Reviewer and Manager evidence must include fresh command output or exact-SHA CI receipts rather than a prose claim that quality gates passed.
- [ ] Installed ESLint/TypeScript capabilities enforce every reliable zero-baseline rule from the architecture article; no custom text scanner or dependency is added when an existing AST rule can express the invariant.
- [ ] Path aliases are not added while production imports remain shallow and readable; a future alias decision requires repeated deep relative paths, measurable navigation/rewrite friction, TypeScript/Vite/Vitest agreement, and layer-lint rules that still expose ownership direction.
- [ ] Focused tests or isolated hook smoke prove a failing check blocks commit and a green check permits it without creating a real publication; pnpm check, independent review, and exact-SHA CI pass.

## Dependencies

- ABI-015

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260828-ECBD82
- AUTOBATTLEIDLE-DOC-20260827-D1B235
- AUTOBATTLEIDLE-DOC-20260827-FC2B16

## Constraints

- Follow the resolved workflow contract and project instructions.
