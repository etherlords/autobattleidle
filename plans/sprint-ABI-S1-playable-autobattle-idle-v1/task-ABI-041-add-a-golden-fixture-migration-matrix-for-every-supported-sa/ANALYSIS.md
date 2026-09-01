---
plannerFormat: 1
id: ABI-041
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-041 analysis

## Verified current state

- The production boundary has five source slots: V4 current; V3, V2, unversioned legacy, and V1
  historical. Normal startup gives valid V4 precedence; repair and explicit Restore use strict
  V3 -> V2 -> legacy -> V1 precedence.
- Only `save-v1.json`, `save-v2.json`, and `legacy-save-v2.json` are committed fixtures. The authentic
  pre-player-relative V3 encounter-2170 save and active-Golden V3 are duplicated inline; there is no
  committed current-V4 fixture or one table that enumerates every supported shape.
- Existing focused tests separately cover V1 promotion, V2 publication, legacy import, V3 2170,
  active Golden V3, valid-V4 startup, corruption fallback, failed writes, and stale retry cancellation.
  They do not enforce a closed fixture inventory, so adding/changing a decoder can omit a historical
  version without one obvious default-suite failure.
- Vault `Persistence Contract#write-and-load` and `#migration-commit-and-recovery`, contentHash
  `de611159417695f3400a413a2ef51cab77c24a55478ff212095fa4ab6bea4191`, require exact source-byte
  preservation, deterministic V4 publication, strict precedence, and balance-formula compatibility.
- Persistence impact: **no schema change**. ABI-041 adds golden fixtures and characterization tests;
  runtime code changes are out of scope unless the matrix proves an existing acceptance failure.

## Approach

- Commit immutable JSON fixtures for pre-player-relative V3, active-Golden V3, and current V4. Keep
  the existing authentic V1/V2/legacy fixtures unchanged.
- Add one typed table-driven migration matrix using the production `createPersistenceBoundary`.
  Each row owns its source key/raw bytes and expected canonical semantic projection; it proves load,
  V4 publication where historical, source retention, and V4 reload at a later `nowMs`.
- Keep focused fault tests for precedence, malformed-newer fallback, valid-current startup, explicit
  Restore, write retry, and stale pending cancellation, but consume the committed fixtures rather
  than duplicated JSON strings.
- Add an explicit supported-fixture manifest assertion so a future version/shape must update the
  matrix in the same default `pnpm check` run.

## Risks

- Property ordering is not semantic equality for V4 but historical source strings must remain exact;
  assertions must distinguish those two contracts.
- Active Golden reload reconstructs timing and normalized derived enemy values, so expected dynamic
  timestamps must be asserted intentionally rather than copied from the source.
- A generated fixture from current code would self-confirm the implementation. Every historical
  fixture must come from repository history or the supplied production save; the V4 fixture must be
  a reviewed literal canonical payload.
- Consolidation must not delete independent corruption/failure coverage or weaken exact field checks.
