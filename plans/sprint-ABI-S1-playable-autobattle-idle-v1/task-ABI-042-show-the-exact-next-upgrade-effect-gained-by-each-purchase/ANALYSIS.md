---
plannerFormat: 1
id: ABI-042
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-017
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-042 analysis

## Verified current state

- `src/domain/combat/upgrades.ts` already owns `nextUpgradeLevel`, the displayed gameplay quanta,
  combined skipped-level cost, validation, and purchase application. It is the only safe owner for a
  next-click preview.
- `presentBattleUpdate` currently projects only cost, disabled reason, label, and level into
  `UpgradeSnapshot`; `UpgradeDialog` therefore cannot show the purchased stat delta without a new
  projection.
- Existing visible precision is damage as an integer/compact number, chance and penetration at one
  percentage decimal, and automatic speed at two APS decimals. Automatic unlock is a capability,
  not a numeric stat delta.
- Vault `AUTOBATTLEIDLE-DOC-20260827-A798F2` requires every paid click to advance the displayed
  gameplay quantum and explicitly forbids duplicating combat formulas in the HUD.
- Persistence impact: no schema change. The preview is derived transient presentation data; V1-V4
  load, save, reload, and Restore behavior must remain unchanged.

## Approach

- Reuse `nextUpgradeLevel` and each existing strategy's `displayedValue` to expose one domain-owned
  next-purchase preview. Return no numeric preview at a terminal endpoint; represent automatic unlock
  as clear capability copy.
- Project one ready-to-render visual/exact effect label through the existing `UpgradeSnapshot` path.
  The UI renders a third stable card line and includes the exact effect in the button's accessible
  name/title.
- Keep pricing, bulk click quantities, controller purchase loops, formulas, and save codecs unchanged.
- Acceptance layers: domain preview and skip behavior are unit tests; presenter/HUD updates and
  restored snapshots are integration tests; desktop/narrow purchase consistency is deployed QA.

## Risks

- Recomputing a separate target level would drift from price/purchase validation; the preview must
  call the existing selector.
- Compact damage formatting can hide exact large deltas; the accessible label must retain the exact
  integer.
- A third line can overflow the fixed upgrade-card grid; focused desktop/narrow layout checks must
  cover stable sizing.
- Disabled unlock, prerequisite, insufficient-coins, and numeric-endpoint rows must not promise an
  unavailable gain.
