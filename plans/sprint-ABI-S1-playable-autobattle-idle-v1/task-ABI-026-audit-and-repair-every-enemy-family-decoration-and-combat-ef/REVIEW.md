---
plannerFormat: 1
id: ABI-026
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-007
  - ABI-022
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-026 review

## Verdict

CHANGES_REQUIRED — independent reviewer. Fresh focused Vitest (30/30), `pnpm check` (17 files/102 tests), and `git diff --check` passed; the two acceptance gaps below require one bounded repair and fresh re-review.

## Findings

- **P1 — Hardened Mantis attachment regression.** `reinforced-band` unconditionally uses local `(0, 0, 0)` instead of the selected profile attachment, while hardened maps to Mantis and each deterministic variant defines a distinct authored attachment. Restore the appropriate profile-local transform and add exact regressions for all hardened variants.
- **P1 — Canonical audit matrix missing.** Acceptance requires an inventory/traced evidence matrix covering every family, grade, deterministic variant, modifier/decoration, effect class, and runtime receipt. High-level prose and aggregate tests do not yet provide that per-item evidence.

## Re-review — 2026-08-30

### Verdict

PASS — both prior P1 findings are repaired; no regression was found in the bounded re-review scope.

### Evidence

- `reinforced-band` now retains the exact selected `profile.attachment` as its only local transform under the neutral `pose` anchor. The existing builder mounts a component once, so the profile offset is not double-applied.
- The exhaustive family/profile loop reaches and asserts all three Mantis variants, then verifies `renderedVariants.size === 3`; each hardened band exactly equals its selected profile attachment.
- `VERIFICATION.md` now inventories 8 families × 3 variants, all grade/modifier/decorations and all nine current battlefield effect kinds. It truthfully labels browser receipts `QA-P`, pending independent QA.
- Fresh `pnpm check` passed: ESLint, Prettier, 17 Vitest files / 102 tests, TypeScript, and Vite production build. `git diff --check` passed.
