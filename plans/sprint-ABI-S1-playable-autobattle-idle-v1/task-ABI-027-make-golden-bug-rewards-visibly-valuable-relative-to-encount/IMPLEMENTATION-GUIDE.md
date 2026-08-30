---
plannerFormat: 1
id: ABI-027
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-027 implementation-guide

## Frozen scope

- Owners: `src/domain/combat/balance.ts`, `progression.ts`, and `attacks.ts` for payout; `src/app/battle/presenter.ts` and controller call sites for bounded feedback.
- Reuse the existing reward, double-reward, safe-saturation, event-log, number-format, and V3 persistence paths. No new currency, modal, timer, save field, service, abstraction, or dependency.
- Persistence classification: **no schema change**.

## Implementation sequence

1. Add a deterministic audit table in focused tests for Golden Bug factor, ordinary/boss rewards, representative upgrade costs, and timed health pressure.
2. Change the single balance factor to 50 and remove the Golden Bug exception from the existing one-pass double-reward calculation.
3. Pass the existing `goldenBugBefore` fact into reward-log formatting and render a distinct compact-plus-exact payout message.
4. Add kill, double, escape, exact-deadline, stale repeated command, saturation, and active-event save/reload regressions; run focused tests and `pnpm check`.

## Verification matrix

- Unit: early/mid/late payout audit, ordinary/boss/upgrade comparisons, TTK pressure, rounding/saturation, one double multiplier, zero escape reward, exact-deadline expiry, stale command ignored.
- Integration: controller emits one distinct Golden Bug payout event; active Golden Bug V1/V2/V3-compatible load -> save -> reload remains valid with no schema change.
- Deployed: isolated desktop 1280x800 and narrow 390x844 fixtures prove kill payout, escape zero, reload safety, bounded log, exact accessible value, clean console/network, and public asset identity at the published SHA.
