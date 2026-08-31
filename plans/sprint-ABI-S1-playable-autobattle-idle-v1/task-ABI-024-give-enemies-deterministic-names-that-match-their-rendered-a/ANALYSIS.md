---
plannerFormat: 1
id: ABI-024
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-024 analysis

## Verified current state

- `selectEnemyFamilyIdentity` already owns the deterministic family, label, seed, and variant contract for beetle, brute, wisp, mantis, sentinel, drake, colossus, hydra, and Golden Bug.
- `createBattleSnapshot` publishes `identity.label`; `enemyVisualSpec` independently consumes the same identity and uses `identity.family`, `identity.seed`, and `identity.variant`. There is no second naming map in the HUD or Three.js path.
- Existing tests cover all shipped family keys, Golden Bug identity, one ordinary snapshot label, and shared visual-family selection. They do not yet explicitly prove every label, grade composition, or reload-equivalent name/body parity.
- Dependencies ABI-009 and ABI-023 are Done. Vault article `AUTOBATTLEIDLE-DOC-20260827-A7FD1F` defines this shared deterministic presentation contract.
- Persistence impact: **no schema change**. Naming remains derived snapshot data and must preserve supported historical-save load/reload behavior.

## Approach

- Reuse the existing classifier. Do not add another mapper, save field, repository, or dependency.
- Add the smallest focused regression coverage for every family label and for reload-equivalent snapshot/visual parity, including Golden Bug.
- Change production code only if a focused test exposes a real acceptance gap. Keep grade text composed once by the existing battle-status row so the archetype name remains intact.
- Acceptance layers: mapping and determinism are unit; historical-save reload and snapshot/visual parity are integration; desktop and 390px readability plus exact-SHA Pages behavior are deployed QA.

## Risks

- A duplicate name map would drift from the rendered family; prevent this by asserting against the shared identity result.
- Persisting the derived name would create needless migration and stale-save risk; keep it out of codecs and state.
- Synthetic fixtures can misrepresent valid saves; deployed QA must use production codecs/builders and isolated browser storage.
