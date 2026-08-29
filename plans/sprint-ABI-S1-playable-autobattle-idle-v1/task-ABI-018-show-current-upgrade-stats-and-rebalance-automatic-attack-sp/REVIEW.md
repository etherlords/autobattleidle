---
plannerFormat: 1
id: ABI-018
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018 review

## Verdict

APPROVE

## Findings

No remaining P0-P3 findings.

### Re-review of prior P1

The prior review required APS in the primary HUD rather than only in the upgrades modal. The repair consumes the existing immutable snapshot value and retains the cooldown: `src/ui/hud/battle-status.ts:68-70` now renders `Automatic attack: <APS> · <remaining>s` when unlocked and reports APS while locked. `src/ui/hud.test.ts:190-192` asserts the public text. The separate domain proof still establishes that the elite automatic-slow modifier adds exactly 500 ms to the APS-derived interval (`src/domain/combat.test.ts:59-62`), so the status continues to receive and represent the correct cooldown semantics.

## Evidence reviewed

- Formula implementation uses the required stable ratio form and a below-3 cap in `src/domain/combat/upgrades.ts:39-51`; the automatic interval continues to add exactly the existing 500 ms elite slow at `src/domain/combat/upgrades.ts:95-97`.
- Fresh `pnpm check` passed: ESLint, Prettier check, Vitest 14 files / 89 tests, TypeScript build, and Vite build. The existing Vite 500 kB chunk-size warning remains non-blocking. `git diff --check` passed.
- No persistence schema/codec shape is changed by the diff; derived `playerStats` is a snapshot-only presentation contract. Vault articles `AUTOBATTLEIDLE-DOC-20260827-85CBFC`, `AUTOBATTLEIDLE-DOC-20260827-584401`, `AUTOBATTLEIDLE-DOC-20260827-A798F2`, and `AUTOBATTLEIDLE-DOC-20260827-E27CD3` were fresh and support the formula, ownership, and no-schema constraints.

Browser/device and deployed Pages proof remain the independent QA and Manager gates; this approval covers the fresh code review only.
