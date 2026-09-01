---
plannerFormat: 1
id: ABI-040
artifact: implementation_guide
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

# ABI-040 implementation-guide

## Frozen scope

- Touch only persistence validation/migration/source-selection and focused tests.
- Do not alter combat balance, rewards, upgrades, save keys/version, source bytes, UI layout, or the
  user's live Chrome storage during implementation/QA.
- Source precedence is V4 for normal startup; for migration/explicit Restore it is valid V3, V2,
  unversioned legacy, then V1.

## Implementation sequence

1. Add the exact encounter-2170 V3 plus lower V2/unversioned siblings as a focused test.
2. Prove current code falls through to encounter 30.
3. Add the narrow V3 previous-balance recognizer and normalize only derived enemy HP at the same
   encounter, preserving remaining-health ratio.
4. Replace `needsV2Repair` with explicit valid historical-source availability; keep valid V4 startup
   precedence and make explicit Restore publish the newest valid historical source.
5. Cover corrupted V3 fields, valid-current startup, atomic write failure/retry, source-byte retention,
   and V1-V4 reload.

## Verification matrix

- Unit: exact V3 2170 -> V4 2170; coins/player/unlock preserved; expected normalized boss and ratio.
- Unit: V3 > V2 > legacy > V1; malformed newer sources fall through only after strict rejection.
- Unit: valid V4 startup wins; explicit Restore selects V3 and overwrites only V4.
- Unit: failed V4 publication returns migrated in-memory state and retries without source mutation.
- Regression: focused persistence suite and full `pnpm check`.
- Independent deployed QA: isolated origin fixture, migrate/Restore/reload at 2170, clean console/network,
  exact-SHA Pages asset identity. The user's live save is repaired only after the deployed fix and a
  separate action-time confirmation.
