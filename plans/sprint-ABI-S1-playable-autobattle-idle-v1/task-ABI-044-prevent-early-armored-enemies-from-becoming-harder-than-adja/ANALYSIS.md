---
plannerFormat: 1
id: ABI-044
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-028
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-044 analysis

## Verified current state

- Production `ArmorEnemyModifier` and `HardenedEnemyModifier` both add
  `encounter * 2` armor. Armor therefore scales independently of the player-relative damage and HP
  owner introduced by ABI-020.
- Production-path simulation with 100 ms manual input reproduces the wall: encounter 48 hardened has
  96 raw / 77 effective armor and takes 463 minimum-damage packets; encounter 57 armored has 114 raw
  / 89 effective armor and takes 420 minimum-damage packets. The adjacent ordinary enemies retain
  their intended 1/5/10-hit targets.
- A bounded encounter-36 fixture isolates the formula: player damage 31, penetration 15%, enemy HP
  310, raw armor 72, effective armor 61, final non-critical damage 1, and 310 required manual hits.
  The adjacent boss health target is 30 base attacks; boss armor remains owned by the separate blocked
  boss-balance work and is out of this repair.
- The battle snapshot exposes player penetration but omits enemy raw/effective armor, so the HUD can
  only label the modifier `Armored` and cannot explain the reduction.
- Persistence impact: **no schema change**. Enemy armor remains derived deterministic state, but V3 and
  V4 load -> normalize -> save -> reload must remain covered because restored enemies are revalidated
  against production spawn rules.
- Valid pre-cap V3/V4 saves may contain an active armored elite with the former uncapped derived armor.
  The decoder must recognize only that exact historical player-relative enemy shape, normalize it to
  the current capped spawn while retaining its health fraction and all canonical progress, then prove
  the new save reloads. This is compatibility normalization, not a schema version change.

## Approach

- Cap armor added by the `armor` and `hardened` elite modifiers from the current player's production
  damage budget. At zero penetration an armored elite must need at most 20 non-critical attacks and a
  hardened elite at most 25, both below the unchanged 30-hit boss health target; penetration only
  reduces those counts. Keep the existing encounter curve below the cap so low encounters do not get
  stronger.
- Put the cap in the shared modifier/spawn path used by runtime, simulator, and persistence validation;
  do not patch attack callers or the UI.
- Add raw armor and derived effective armor to `BattleEnemySnapshot`, then render one compact combat
  line containing armor, effective armor, and player penetration. This is derived presentation data,
  not a second combat owner.
- Preserve boss armor, Golden Bug, ordinary HP variety, rewards, upgrades, and save schema.
- The old encounter `24,920` at 48 hours and `30,234` at 49 hours are measurements, not promised
  level goals. They encoded the time spent on the defective armored walls. With the global corrected
  cap, the exact production checkpoints are encounter `250,863` at 48 hours (first non-boss endgame
  probe after boss `250,845`) and `257,354` at 49 hours. This retains the user-approved time-based
  endgame boundary while rebaselining its derived encounter number.

## Risks

- A cap based on stale `player.damage` instead of `damageLevel` would disagree with the canonical damage
  formula. Reuse `damageForLevel` exactly as combat does.
- Changing every armor source would silently weaken bosses; limit the repair to the two elite modifier
  strategies.
- Snapshot/UI arithmetic could drift from attack resolution. Compute effective armor with the existing
  `effectiveArmor` helper and regression-test the displayed values against a real attack event.
- Changing derived armor can invalidate historical save normalization. The supported V3/V4 fixture
  matrix and reload round trip are mandatory integration evidence.
- The corrected 48-hour simulation resolves roughly ten times more encounters. Its warmed event-jump
  leg measures about 6.17 seconds on the reference workstation, so the former 5-second assertion is no
  longer a valid portable bound. Retain exact/event-jump state equality and use the measured 8-second
  performance ceiling rather than weakening the equivalence proof.
- Keeping the old absolute encounter checkpoint would require restoring a wall or compensating through
  unrelated economy/reward changes. Both contradict this task's root-cause scope; the deterministic
  time-based checkpoint is therefore remeasured rather than preserved as a product invariant.
