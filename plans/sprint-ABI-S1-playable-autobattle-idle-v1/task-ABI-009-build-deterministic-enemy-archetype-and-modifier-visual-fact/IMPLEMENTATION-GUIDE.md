---
plannerFormat: 1
id: ABI-009
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-009 implementation-guide

## Frozen scope

- ABI-009 only: replace the single grade primitive with one deterministic presentation factory.
- Inputs are immutable snapshot identity/presentation fields. Outputs are an owned Three.js group
  plus minimal inspectable composition metadata. No combat writes or second state owner.
- Include several ordinary body families, dedicated boss bodies, seeded ornaments, and non-color-only
  armor, vitality, automatic-slow, and dormant wealth compositions.
- Wealth runtime activation is excluded because the domain currently has no wealth modifier. Existing
  reward semantics are deterministic enemy base reward plus a player-owned defeat roll; do not infer a
  wealth state from reward magnitude. ABI-010 remains untouched.
- No dependency, asset-pipeline, persistence-schema, or balance changes. Preserve `.playwright-cli`.

## Implementation sequence

1. Add the smallest `src/game` factory that derives a stable seed from enemy level and selects an
   ordinary family or dedicated boss family.
2. Compose grade silhouette, exactly one modifier attachment, and bounded seeded decorations using
   existing Three.js primitives/materials.
3. Route battlefield enemy creation through the factory while retaining its current identity key,
   replacement, effect cap, and disposal seam.
4. Add focused tests for deterministic families/decorations, all cue metadata, boss composition,
   bounded child/resource counts, repeated replacement, and idempotent disposal.
5. Run focused tests and `pnpm check`; then hand the complete diff to independent review and browser QA.

## Verification matrix

- Unit: stable seed and composition across repeated calls; multiple ordinary families; dedicated boss
  bodies; armor/vitality/slow/dormant-wealth geometry metadata; several ornament variants; bounded
  object counts; disposal once.
- Integration: live snapshots replace only on identity changes; effects remain capped; a long sequence
  does not grow scene children/resources; current and historical saves load, save, and reload unchanged.
- Browser desktop and 390px: capture every ordinary family, every active modifier, dedicated bosses,
  and a clearly marked synthetic dormant-wealth matrix; verify silhouette readability without color,
  clean console, no overflow, and stable long-run renderer resource counts.
- Publication: `pnpm check`, independent Reviewer PASS, independent QA PASS, Vault sync, exact commit
  pushed to `main`, green exact-SHA CI/Pages, public visual/resource proof, and final root audit.
