---
plannerFormat: 1
id: ABI-021
artifact: progress
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

# ABI-021 progress

## Current state

- Status: Blocked
- Revision: 1
- Last update: Bootstrapped

## Execution plan

- [ ] gate-preflight: Manager audits current CI/package scripts/import depth and freezes hook install/bypass/repair semantics
- [ ] native-hook: Implementation owner adds the smallest tracked native pre-commit hook and idempotent local installer without dependencies
- [ ] lint-audit: Implementation owner fills only reliable zero-baseline ESLint gaps expressible by installed AST rules
- [ ] alias-decision: Reviewer records keep-relative-paths or alias decision from measured depth and toolchain/layer-lint consequences
- [ ] self-check: Implementation owner proves red/green hook behavior without real commit and runs pnpm check
- [ ] independent-gates: Independent Reviewer verifies bypass/CI parity and QA verifies Windows installation/smoke
- [ ] manager-closure: Manager updates Vault workflow, publishes, and proves exact-SHA CI

## Events

_No progress events recorded._
