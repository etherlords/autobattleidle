---
plannerFormat: 1
id: ABI-017
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

# ABI-017 analysis

## Verified current state

- Planner selected ABI-017 uniquely at priority `normal`; ABI-015 and ABI-023 are Done, no foreign lease exists, and Planner doctor requires no recovery.
- `HudIntent` currently carries a single upgrade ID; `UpgradeDialog` owns one click listener per upgrade and the modal focus/dismissal lifecycle.
- `Application` is the composition root. `BattleController` owns purchase state and ordered event publication; persistence and rendering currently subscribe to each published controller update.
- The pure `purchaseUpgrade` domain operation already calculates one exact level/cost and returns the original state plus a reason on failure.
- Vault `AUTOBATTLEIDLE-DOC-20260827-85CBFC` freezes modifier precedence, sequential parity, no failed-attempt event, and one final render/save.
- Persistence impact: **no schema change**. V1/V2 fixtures and supported historical-save load/reload remain required regression evidence.

## Approach

- Extend the existing named HUD upgrade intent with quantity; derive `Ctrl => 100`, else `Shift => 10`, else `1` from the click event.
- Reuse the existing controller/domain purchase path to apply sequential levels. Publish successful `Purchased` events in order, stop at the first failure, and publish one final state update only when at least one purchase succeeds.
- Add one compact dialog hint and owner-local styling; do not redesign the modal or add a dependency/abstraction.
- Focused tests cover intent mapping/precedence, 10/100 bounds, partial stop and repeated-single parity, event order, failed-attempt identity, one render/save, accessibility, disposal, and historical-save compatibility.

## Risks

- Repeated controller dispatch would render and persist intermediate states; the batch must be atomic at the controller publication boundary.
- A synthetic summary/failure event would violate the frozen event contract.
- Modifier handling must use the actual click event while preserving keyboard activation as quantity 1.
- Acceptance layers: intent/domain parity are unit/integration; modal focus, accessibility, responsive layout, reload, and deployed behavior are browser/deployed QA.
