---
plannerFormat: 1
id: ABI-024
artifact: implementation_guide
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

# ABI-024 implementation-guide

## Frozen scope

- Preserve `src/domain/combat/family-identity.ts` as the sole presentation classifier used by both snapshot naming and Three.js body selection.
- Cover every ordinary, authored modifier, boss, and Golden Bug label; preserve one grade token plus one archetype label in the current battle-status row.
- No combat, balance, reward, progression, persistence codec, save schema, dependency, or broad UI redesign changes.

## Implementation sequence

1. Extend the existing family-identity test with explicit family-to-label expectations.
2. Add one focused reload-equivalent contract test proving snapshot name and visual body come from the same identity for ordinary, modifier, boss, and Golden Bug inputs.
3. Only if those tests expose a gap, patch the existing shared classifier or battle-status composition at the narrowest responsible layer.
4. Run focused Vitest, then `pnpm check`.

## Verification matrix

- Unit: every shipped family maps to its readable label; Golden Bug remains `Golden Bug`; invalid levels still fail closed.
- Integration: production encode/decode reload preserves the derived snapshot name and rendered body for representative ordinary, modifier, boss, and Golden Bug states; no save bytes gain a name field.
- Deployed: desktop and 390px show grade and full archetype without clipping or overlap; browser reload retains name/body parity; console is clean.
- Gates: implementation self-check, independent review, independent QA, verification, Manager closure, CI, Pages, and exact-SHA public proof.
