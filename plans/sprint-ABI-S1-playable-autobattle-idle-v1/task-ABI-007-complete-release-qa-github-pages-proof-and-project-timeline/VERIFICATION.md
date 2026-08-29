---
plannerFormat: 1
id: ABI-007
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007 verification

## Acceptance evidence

- Dependency closure: ABI-006, ABI-008, ABI-009, ABI-010, and ABI-011 are Done; ABI-011 closure SHA `d6521e0` is an ancestor of the candidate baseline.
- Product repair: shared deterministic family identity, correct HUD names, eight authored enemy families, family-local attachments, bounded shield/decor motion, one-shot spawn/hit/critical/death commands, and read-only canvas family/effect receipts.
- Focused verification: 30 focused tests PASS.
- Canonical local gate: `pnpm check` PASS with 17 files / 99 tests, TypeScript build, and Vite production build. The existing approximately 599 kB chunk warning is advisory.
- Native hook proof: `pnpm hooks:smoke` PASS; red case blocked, green case permitted, no commit created, no index mutation.
- Independent review: final PASS after production-policy family fixtures were bound to canvas family/variant/seed receipts.
- Independent QA: final PASS against the local production candidate at 1280x800 and 390x844. The repeatable 21-scenario production-codec matrix reports `count=21`, `bad=0`, one canvas, no console errors, no failed requests, and no overflow.
- QA coverage: real pointer drag/cancel/tap, Enter/Space, normal and slowed automatic timing, manual independence, upgrade interaction, bosses 35/70/105, Golden Bug kill/escape/reload, V1/V2/V3 recovery and future/reset behavior, all eight families before/after reload, named effect traces, reduced motion, and bounded resources.
- Vault sync: `Enemy Tiers and Boss Cadence` and `UI, Persistence, and QA` now record the accepted visual/receipt and candidate-versus-exact-SHA contracts; Vault remains the canonical design source.
- Publication gate: exact candidate commit, CI run, Pages deployment, loaded asset hashes, and public functional recheck are intentionally Manager-owned and must be appended after push before manager closure.

## Planner-derived timeline

| Stage | Canonical evidence |
| --- | --- |
| Dependency and release preflight | Dependencies closed; frozen production-codec release matrix and actor ownership recorded. |
| Initial review repair | QA traceability, automatic-bar semantics, pre-closure versus post-push ownership, and active Golden Bug reload oracle corrected and re-reviewed. |
| Product repair | Family identity/labels, eight readable bodies, attachment/motion, visible combat commands, and read-only QA receipts implemented. |
| Self-check | Focused tests, `pnpm check`, hook smoke, and local production smoke passed. |
| Independent review | One P1 fixture-label finding returned; production-policy fixtures and receipt assertions repaired; fresh re-review passed. |
| Independent QA | Initial candidate runs returned missing-receipt and fixture-overwrite findings; bounded harness repairs separated inputs from receipts and completed a repeatable 21-scenario matrix. |
| Final candidate verdict | Independent QA PASS at progress revision 109; accepted QA plan steps reconciled through revision 116. |
| Publication and deployed proof | Pending exact commit/push, CI/Pages success, public asset/SHA binding, and Manager browser recheck. |

## Sign-off

- Reviewer: PASS (`abi007-review`)
- QA: PASS (`abi007-qa`, 21 scenarios, `bad=0`)
- Verification: pre-publication acceptance PASS; exact-SHA publication proof pending Manager
- Manager close: pending exact-SHA CI/Pages and deployed recheck
