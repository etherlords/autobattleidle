---
plannerFormat: 1
id: ABI-013
artifact: brief
project: ABI
profile: high-assurance
revision: 3
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

# ABI-013: Preserve and migrate historical localStorage saves without progress loss

## Goal

Preserve and migrate historical localStorage saves without progress loss

## Work item

- Type: task
- Priority: critical
- Status: Ready

## Acceptance criteria

- [ ] The historical schema-version-1 payload from repository history loads in the current schema-version-2 runtime without resetting valid progress.
- [ ] Saves use app-namespaced, version-addressed localStorage slots (for example version 1 and version 2 slots) so creating the current-version save never deletes or overwrites the previous-version payload.
- [ ] Before domain state, combat timers, rendering, or autosave start, application bootstrap checks the current-version slot; when it is absent and a supported previous-version slot exists, bootstrap validates, migrates one version at a time, validates the result, and only then starts the rest of the application.
- [ ] The V1-to-V2 migration preserves coins, encounter and enemy state, automatic unlock, damage, critical, double-reward, and automatic-speed progress, and initializes armor penetration to the documented safe default.
- [ ] Save loading parses unknown data once, validates the source-version shape, applies deterministic one-version-at-a-time migration, validates the current shape, and reconstructs derived values through domain formulas.
- [ ] The previous-version slot remains byte-for-byte available after success or failure; the current-version slot is published only after migration, current-schema validation, and storage write succeed, and a failed write does not destroy the valid in-memory session.
- [ ] The UI exposes an accessible Restore from previous version action when a supported prior slot exists; explicit repair revalidates and remigrates that prior slot, replaces a missing/empty/invalid current slot only after success, reports failure without data loss, and never deletes the prior slot.
- [ ] Golden V1 and V2 fixtures prove first bootstrap migration, semantic equality, versioned save creation, second reload from the current slot, explicit repair of a missing/empty/invalid current slot, and preservation of the prior slot; malformed and unsupported-future payloads still recover safely without crashing.
- [ ] A reusable release guard requires every future task to classify persistence impact as no schema change, compatible extension, or schema migration and to provide the corresponding historical-save regression evidence.
- [ ] Real-browser QA seeds an actual V1 slot in the deployed application, proves migration completes before gameplay starts, preserves V1, creates stable V2, reloads from V2, then proves the Restore action repairs a deliberately empty/invalid V2 from V1.
- [ ] Persistence Contract and UI/Persistence/QA workflow documentation define slot naming, bootstrap ordering, retention and repair semantics; no unrelated gameplay, HUD redesign, or ABI-007+ implementation is included.

## Dependencies

- ABI-005
- ABI-006

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-E27CD3
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
