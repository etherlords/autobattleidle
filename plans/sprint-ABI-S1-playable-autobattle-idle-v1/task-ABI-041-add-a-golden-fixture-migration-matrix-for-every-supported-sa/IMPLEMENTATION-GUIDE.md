---
plannerFormat: 1
id: ABI-041
artifact: implementation_guide
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

# ABI-041 implementation-guide

## Frozen scope

- Own only `src/persistence/fixtures/`, persistence boundary tests, and ABI-041 Planner/Vault evidence.
- Do not change save keys/version, production precedence, codecs, combat/balance formulas, UI, Worker,
  or the user's browser storage. A discovered runtime defect returns for explicit bounded repair.
- Preserve existing fixture bytes and add reviewed historical literals; do not manufacture historical
  expectations by encoding current runtime state inside the test.

## Implementation sequence

1. Inventory the exact shipped envelopes and trace each fixture to repository history or supplied
   production evidence.
2. Extract the authentic encounter-2170 and active-Golden V3 strings into immutable JSON fixtures;
   add one reviewed valid V4 fixture with non-zero Golden defeats.
3. Define one typed matrix of source key, fixture, expected canonical projection, and publication mode.
4. For every row run production load -> assert semantic state/source bytes -> assert V4 -> reload at a
   later clock -> assert canonical continuity.
5. Reuse fixtures in the precedence, corruption, Restore, failed-write, and stale-retry regressions;
   keep those boundary risks explicit rather than hiding them inside a generic loop.
6. Add a closed manifest/count assertion covering V1, V2, legacy, pre-player-relative V3,
   active-Golden V3, and current V4; run focused tests, `pnpm check`, and `git diff --check`.

## Verification matrix

- Unit: every immutable fixture decodes strictly and produces the expected encounter, currency,
  upgrades, unlock, Golden state/defeats, and bounded health semantics.
- Integration: production storage lifecycle proves historical publish/reload, valid-V4 no-republish,
  V3 -> V2 -> legacy -> V1 precedence, explicit Restore, malformed fallback, failed write retry,
  stale-pending cancellation, and exact historical source retention.
- Deployed: isolated Pages storage injects representative V1, V2/legacy, V3 2170, active V3, and V4;
  visible/persisted state survives reload with clean console/network and exact-SHA asset identity.
- Regression gate: the matrix runs under default `pnpm check`; removing any supported fixture row or
  drifting a frozen historical formula fails deterministically.
