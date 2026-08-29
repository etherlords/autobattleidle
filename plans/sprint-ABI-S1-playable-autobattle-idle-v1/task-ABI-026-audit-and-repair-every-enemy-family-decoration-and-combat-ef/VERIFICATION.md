---
plannerFormat: 1
id: ABI-026
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-007
  - ABI-022
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-026 verification

## Acceptance evidence

### Canonical visual audit matrix (implementation evidence)

`QA-P` means **assigned to independent QA** for the post-implementation browser/screenshot receipt; it is not a claim of browser proof. The rows intentionally expose only current authored variants and cues.

| Family | Variant 0: attachment; decorations; core/accent | Variant 1 | Variant 2 | Owner and deterministic evidence | Runtime receipt |
| --- | --- | --- | --- | --- | --- |
| beetle | `[.58,.18,0]`; fins/scar; `#ff9d66/#cf563f` | `[.64,.1,0]`; horns/orbitals; `#e88554/#b9483c` | `[.54,.24,0]`; satellites/fins; `#f2b264/#ce743e` | `enemy-visual/spec.ts` profile registry; `bodies.ts` shell/head/6 legs; `enemy-visual.test.ts` exhaustive profile loop | QA-P |
| brute | `[.74,.22,0]`; orbitals/fins; `#f3bd58/#d7923e` | `[.78,.1,0]`; scar/horns; `#d69d4f/#a96938` | `[.7,.3,0]`; satellites/orbitals; `#e9c46a/#b68f4d` | registry; body head/arms/feet; exhaustive loop | QA-P |
| wisp | `[.56,.3,0]`; horns/satellites; `#bd7cff/#8f5acb` | `[.52,.38,0]`; orbitals/scar; `#7da8ff/#527dcc` | `[.6,.25,0]`; fins/satellites; `#d58cff/#a65abc` | registry; body aura/tail/sparks and squash motion; exhaustive loop | QA-P |
| mantis | `[.72,.56,.38]`; fins/satellites; `#a7d65d/#57a98c` | `[.76,.5,.38]`; horns/scar; `#6bc9a4/#b7ad4d` | `[.68,.6,.38]`; satellites/fins; `#cfbf5f/#58a76e` | registry; head/abdomen/scythes; exact hardened-band transform asserted for all three variants | QA-P |
| sentinel | `[.86,.18,0]`; scar/orbitals; `#7899ba/#b97d4e` | `[.9,.12,0]`; horns/scar; `#5a77b8/#9c6945` | `[.82,.24,0]`; orbitals/satellites; `#8b9ca4/#c08c5a` | registry; visor/pylons/legs; exhaustive loop | QA-P |
| drake | `[.92,.08,0]`; horns/fins; `#d55c65/#7b4dab` | `[.88,.16,0]`; fins/scar; `#7763c7/#d36d71` | `[.96,.04,0]`; satellites/horns; `#7bbde1/#aa5f91` | registry; head/wings/tail; exhaustive loop | QA-P |
| boss-colossus | `[.88,.35,0]`; horns/satellites; `#e9576d/#b93654` | `[.92,.28,0]`; scar/orbitals; `#c75c7a/#91405c` | `[.84,.4,0]`; fins/horns; `#ed7c55/#bc4f39` | registry; head/shoulders/arms; shared pose and `<=.1` death drop test | QA-P |
| boss-hydra | `[.82,.42,0]`; fins/horns; `#d754c3/#ff8fdb` | `[.86,.35,0]`; satellites/scar; `#a85ccf/#d99aff` | `[.78,.5,0]`; horns/orbitals; `#df6d91/#f7a6b8` | registry; three neck/head/horn sets; crown parent is center head; shared pose test | QA-P |

| Grade / modifier cue | Concrete cue and anchor | Owner/test evidence | Runtime receipt |
| --- | --- | --- | --- |
| normal / veteran / elite / boss | none / crest / spikes / crown; crest, spikes, crown attach to `head`; boss Hydra crown is center head | `spec.ts` grade registry; `grade-cue-decorator.ts`; `enemy-visual.test.ts` parentage assertion | QA-P |
| armor | three face-and-rim shields; `side`; bounded orbit/levitation | `modifier-cue-decorator.ts`; shield count/motion test | QA-P |
| health | vitality core; `pose`, front `z=.58` (not inside core) | modifier decorator; bounded visual test | QA-P |
| automatic-slow | time ring plus hand; `pose`; spin/levitation | modifier decorator; animation test | QA-P |
| wealth / Golden Bug | two coins; `pose`; orbit; Golden Bug maps wealth plus crown | `spec.ts`; modifier decorator; Golden Bug test | QA-P |
| hardened | reinforced band; `pose`, exact profile attachment | modifier decorator; Mantis v0/v1/v2 exact-transform test | QA-P |
| critical-guard / manual-guard | prism / directional barrier; `side`, profile attachment | `spec.ts`; modifier decorator; visual composition test | QA-P |

| Decoration | Anchor and behavior | Owner/test evidence | Runtime receipt |
| --- | --- | --- | --- |
| fins | `side`; profile-local side placement | `seeded-decoration-decorator.ts`; profile exhaustive loop | QA-P |
| horns / scar | `head`; local head transforms | decorator; Hydra head/crown parentage and pose-motion test | QA-P |
| orbitals / satellites | `pose`; bounded orbit / levitation | decorator; animation registration and bounded tree tests | QA-P |

| Battlefield effect | Life | Geometry | Bound/disposal/reduced-motion evidence | Runtime receipt |
| --- | ---: | --- | --- | --- |
| spawn / hit | 10 / 10 | RingGeometry / RingGeometry | max 12; reduced motion does not grow; resource disposal asserted | QA-P |
| armor / critical | 10 / 12 | IcosahedronGeometry / **TorusGeometry** | distinct geometry; circular critical regression; same cap/disposal path | QA-P |
| death / coin | 10 / 12 | SphereGeometry / CylinderGeometry | same cap/disposal path | QA-P |
| boss / golden-kill / golden-escape | 18 / 16 / 14 | TorusKnotGeometry / OctahedronGeometry / DodecahedronGeometry | same cap/disposal path | QA-P |

**Traced owners:** deterministic family, profile, grade and modifier selection: `src/game/enemy-visual/spec.ts`; body parts and shared command pose: `src/game/enemy-visual/bodies.ts`; semantic attachment routing: `components.ts`, `builder.ts`, and `decorators/*`; effects: `src/game/battlefield/effects.ts`. Focused contracts: `src/game/enemy-visual.test.ts` and `src/game/battlefield/effects.test.ts`. Save/history determinism remains owned by existing snapshot/persistence tests and is not mutated by this presentation-only task.

### Fresh runtime receipt index

- Candidate binding: HEAD `3df566a2987cea7c633c1354acfdc4f43ecd6908`, scoped visual/effect diff SHA-256 `2b6497e5f502d33cc19c0b60747c37ebd387717934d8ece4d083e9efe3efb2fc`, generated after all scoped source mtimes in `output/playwright/abi026-candidate-summary.json`.
- Motion/effects: seven fresh Hydra, Colossus, ordinary-hit, and armor-shield cases with idle/mid/final/next-idle PNG quartets at desktop, narrow, and reduced-motion coverage.
- Families/persistence: eight fresh before/after reload receipts preserve family, variant, and seed; focused deterministic transform/effect tests pass 30/30.
- Health: one canvas, active effects <=12, zero console errors, failed requests, or overflow.
- Asset boundary: the local receipt records `development-modules`; exact published-SHA CI, Pages assets, and public functional observations remain pending Manager closure and are not claimed by candidate QA.
- Vault sync: `AUTOBATTLEIDLE-DOC-20260827-A7FD1F`, content hash `9b6806617c5153081bdbf8c965d9d8cc1f4249255164e4abcf9f023ea7732c29`.

### Published-SHA deployment proof

- Published code SHA: `8f2546ddc6fd8f015e2f521541233a1b507d18f4` on `origin/main`.
- Exact-SHA CI: PASS, run `33281374857`; exact-SHA Pages: PASS, run `33281374863`.
- Public URL: `https://etherlords.github.io/autobattleidle/`.
- Deployed JS `index-Ch4K_JbE.js`: 600080 bytes, SHA-256 `b2a7481e5eb42a02d4d52b396dfab8f0c0d0d1c666fd21afc804b2c5c3923aa7`; exact match to the local production build from the published SHA.
- Deployed CSS `index-Bv0br866.css`: 2756 bytes, SHA-256 `959ac20905a934abc2c25d7ae43fdcbcee0f3f6f7d2c59e4bf15bc395857c148`; exact match to the local production build from the published SHA.
- Isolated deployed-browser fixtures loaded `boss-hydra` at level 35 and `boss-colossus` at level 70. Both received damage and completed bounded pose changes; the Hydra crown remained attached to the animated center head, the Colossus displacement stayed bounded, and no console warnings/errors were observed.
- The deployed asset identity binds the public browser observations to the source/test evidence for the circular `TorusGeometry` critical cue and the candidate-bound Hydra, Colossus, shield-motion, narrow, and reduced-motion receipts.

## Sign-off

- Reviewer: PASS after one bounded repair and fresh re-review.
- QA: PASS after stale evidence was rejected, a candidate-bound harness repair, and one fresh independent rerun.
- Manager close: published-SHA evidence complete; canonical closure gate pending.
