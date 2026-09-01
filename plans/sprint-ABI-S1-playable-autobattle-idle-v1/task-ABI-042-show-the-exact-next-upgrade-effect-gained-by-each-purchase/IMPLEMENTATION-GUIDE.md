---
plannerFormat: 1
id: ABI-042
artifact: implementation_guide
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

# ABI-042 implementation-guide

## Frozen scope

- Add only the minimum domain preview required to reuse the exact next-effective-level selector.
- Carry the preview through the existing presenter/snapshot contract and render it in existing
  upgrade cards and accessible labels.
- Do not change balance formulas, prices, bulk purchase semantics, save schema/codecs, controller
  ownership, dependencies, or unrelated HUD surfaces.

## Implementation sequence

1. In the upgrade domain module, expose a typed next-purchase preview backed by
   `nextUpgradeLevel` and the existing displayed-value strategy.
2. Extend `UpgradeSnapshot` and `presentBattleUpdate` with one formatted visual/exact effect label;
   use capability copy for automatic unlock and no misleading numeric delta at unavailable endpoints.
3. Add one `upgrade-effect` line to `UpgradeDialog`, include exact copy in aria/title text, and make
   the existing card grid tall enough on desktop and narrow layouts.
4. Add focused domain, presenter, and HUD regressions for each upgrade, skipped levels, purchases,
   Restore-derived snapshots, disabled states, compact exact labels, and layout CSS.
5. Run focused tests, `pnpm check`, independent review, and isolated exact-SHA deployed QA.

## Verification matrix

- Unit: every repeatable upgrade returns a positive displayed delta to the same target level charged
  and applied; high-level skipped targets show the combined delta; terminal endpoints return none.
- Integration: purchase and restored state immediately recompute card copy; automatic unlock and
  prerequisite/insufficient-coins rows remain truthful; exact accessible copy survives compact visual
  formatting.
- Persistence: supported historical fixtures load, publish V4, and reload unchanged because preview
  data is never encoded.
- Deployed: desktop 1440x900 and narrow 390x844 show aligned title, price, and gain; buying each
  representative upgrade changes the stat by the advertised amount with clean console/network.
