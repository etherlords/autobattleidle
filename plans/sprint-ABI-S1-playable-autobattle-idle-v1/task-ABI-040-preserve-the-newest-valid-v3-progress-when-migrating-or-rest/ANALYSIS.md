---
plannerFormat: 1
id: ABI-040
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-013
  - ABI-020
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-040 analysis

## Verified current state

- Chrome production origin contains five preserved slots. The newest historical slot is valid user V3
  at encounter 2170 with 427,622,176 coins and high player levels; current V4 is encounter 30 with 25
  coins. Reload renders Level 30 because valid V4 has startup precedence.
- `readRepairSource` already orders V3 -> V2 -> unversioned legacy -> V1, but `decodeV3` delegates an
  inactive V3 enemy to `decodeV2`. The decoder recognizes current player-relative health and a much
  older 15-encounter cadence, but not the immediately preceding 35-encounter legacy-health formula
  that produced the user's V3. It rejects encounter 2170 and falls through to the older encounter-30
  unversioned source.
- `needsV2Repair` also validates the V2 slot with `decodeV4`; that can never recognize a version-2
  envelope. Restore availability/behavior therefore depends on an accidental always-repair result
  rather than an explicit valid-historical-source contract.
- Historical slots remain byte-for-byte present. No Chrome storage was changed during diagnosis.
- Persistence impact: schema migration repair only; V4 shape and version remain unchanged.

## Approach

- At the V3 boundary, recognize the exact previous 35-encounter legacy-health enemy by rebuilding it
  without a player. Validate every persisted semantic/derived field, then respawn the same encounter
  under current player-relative health and preserve bounded remaining-health proportion.
- Replace the accidental V2-as-V4 repair check with an explicit newest-valid-historical-source check.
  Startup keeps valid-V4 precedence; explicit Restore always republishes the newest valid historical
  source after validation.
- Preserve every source slot; publication writes only V4 and retains the existing pending-write retry.

## Risks

- Validation must not accept forged encounter/grade/modifier/armor/reward/player combinations.
- Normalization must not revive a defeated enemy, produce zero/non-finite HP, or change encounter,
  currency, upgrades, unlock, or Golden Bug semantics.
- Automatic startup must never replace an already valid V4; only explicit Restore may do that.
- The exact user state and lower-progress sibling slots must be regression fixtures so precedence
  cannot silently fall back again.
