---
plannerFormat: 1
id: ABI-027
artifact: analysis
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

# ABI-027 analysis

## Verified current state

- Planner selected ABI-027 with ABI-006 and ABI-010 Done; the task has one live manager lease and no open dependency.
- `spawnGoldenBug` multiplies the resumed same-stage reward by `goldenBugRewardFactor = 10`. Because the event occurs once per 50 defeated encounters, the successful timed kill is worth only about one fifth of an interval of same-stage ordinary rewards.
- `attack` explicitly bypasses the existing double-reward roll while a Golden Bug is active. Escape already awards zero, the enemy-id guard prevents a repeated post-kill command from awarding again, and the controller resolves expiry before an attack at the exact deadline.
- The event log currently reports a generic manual/automatic kill, so the payout is not identified as a Golden Bug reward and compact values do not expose an exact value in the log.
- Persistence already serializes the active event and reloads it with a fresh bounded window. The task is **no schema change** and must preserve V1/V2/V3 load -> save -> reload behavior.

## Approach

- Change the existing centralized factor from 10 to 50. A Golden Bug then pays approximately 50 same-stage ordinary rewards: one cadence interval, large enough to notice without exceeding the ordinary interval economy before the bounded double-reward chance.
- Route Golden Bug kills through the existing double-reward roll exactly once; retain safe-integer saturation and the existing one-transition combat authority.
- Reuse the bounded event log and `formatNumber`: label the Golden Bug kill explicitly and include the exact grouped value when compact text differs.
- Prove representative early/mid/late reward ratios, nearest boss comparisons, upgrade-cost coverage, manual TTK/10-second escape pressure, rounding/saturation, double reward, escape, deadline ordering, duplicate-command protection, and historical-save round trips.

## Risks

- A payout too large could dominate progression. The 50x factor is cadence-derived and deterministic; no respawn, reroll, farming route, or new currency is added.
- Applying double reward twice would inflate the payout. The implementation must keep one requested-reward calculation and one saturation step.
- Changing the event-log contract would expand UI/persistence scope. Keep `BattleEvent` unchanged and format one message at the presenter boundary.
