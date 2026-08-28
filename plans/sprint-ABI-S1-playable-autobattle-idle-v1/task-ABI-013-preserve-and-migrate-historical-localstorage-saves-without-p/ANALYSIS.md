---
plannerFormat: 1
id: ABI-013
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-013 analysis

## Verified current state

- Planner confirms ABI-013 is critical, Ready at task revision 3, dependency-complete (ABI-005 and ABI-006 are Done), and was unclaimed before the Manager lease was acquired.
- Persistence impact: **schema migration**. Git commit `0c66fce` introduced authentic schema V1 under the single key `etherlords.autobattleidle.save`; commit `e83ec78` changed the writer/validator to schema V2 without a V1 adapter or version-addressed slots.
- Authentic V1 player fields are `automaticSpeedLevel`, `criticalChance`, `damage`, and `doubleRewardChance`; V2 adds canonical levels for damage/critical/double reward plus `armorPenetrationLevel`. V1 levels derive as damage minus one and chance times ten; armor penetration defaults to zero. Automatic speed is already canonical.
- V1 and V2 both store coins, automatic unlock, and the full enemy record. Repository history also changed enemy balance at the V2 boundary, so migration must validate the authentic V1 enemy with V1 rules, retain its encounter and remaining-health progress, and create a current-schema enemy that passes V2 invariants without trusting malformed derived values.
- Current startup constructs game and HUD before `persistence.load`, uses one unversioned key, silently falls back on V1, and exposes reset only. Current autosave is debounced and retries a failed write in memory.
- The user supplied a real schema-V2 save still stored under the historical unversioned key `etherlords.autobattleidle.save` (coins 25, boss encounter 30, automatic speed 4, armor penetration 7, critical 5, damage 14, double reward 6). This is a V2 relocation/import case, not V1 migration: validate it as V2, preserve its raw bytes, and publish it to the version-addressed V2 slot only when that slot is missing, empty, or invalid.
- Vault `AUTOBATTLEIDLE-DOC-20260827-E27CD3` requires parse once, source validation, stepwise migration, target validation, domain reconstruction, and retention of the source payload. `AUTOBATTLEIDLE-DOC-20260827-85CBFC` requires historical-load regression and deployed load -> migrate -> save -> reload proof.
- `.playwright-cli/` is pre-existing excluded user/test state and remains unstaged.

## Approach

- Keep one persistence owner. Add app-namespaced version slots (V1 and V2), strict V1/V2 decoders, and one V1 -> V2 adapter; do not add a migration framework beyond the one-step dispatch needed by the contract.
- Bootstrap persistence before battlefield/HUD construction. Prefer a valid versioned V2 slot. Otherwise prefer a valid unversioned schema-V2 payload and publish it unchanged semantically to the V2 slot; only then fall back to migrating valid V1. Publish with one atomic `setItem`, keep the in-memory state usable if publishing fails, and never mutate or remove either source value.
- Expose persistence capability/result needed by one accessible HUD Restore action. Restore rereads and revalidates V1, remigrates, publishes V2 only after success, updates live state, and reports success/failure through an accessible status without deleting V1.
- Preserve normal debounce/pagehide behavior for subsequent V2 saves. Reset affects the current V2 slot only; the retained V1 slot remains repair evidence unless product requirements later explicitly authorize deletion.
- Add authentic golden JSON fixtures copied from Git-era shapes, focused persistence unit tests, one application/HUD integration path, and deployed browser evidence.

## Risks

- Treating V1 as V2 or validating it with current formulas would silently reset valid progress.
- Writing V2 before complete validation, or reusing the V1 key, could destroy the only recoverable payload.
- Creating game/timers/HUD before migration allows gameplay or autosave to race bootstrap.
- A Restore control that merely reloads the page, replaces valid V2 implicitly, or lacks an accessible result violates the repair contract.
- Exact V1 enemy formulas differ from V2; the adapter must explicitly document and test its enemy mapping rather than accidentally accepting inconsistent V2 state.
- Storage reads/writes can throw. Failure must not crash startup, delete V1, or discard a successfully migrated in-memory state.
- Treating the unversioned V2 payload as V1, or letting it overwrite an already valid versioned V2, would lose current progress.
