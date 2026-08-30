---
plannerFormat: 1
id: ABI-031
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-031 qa

## Verdict

PENDING — reserved for an independent owner.

## Evidence

_Pending._

## Fresh independent browser QA

CHANGES_REQUIRED — the fresh candidate run could not complete the matrix because the
QA fixture/oracle pair is inconsistent before the first motion case. The current candidate
identity was independently recorded as HEAD
`0b2850b006e241c4c15b84cc18372c2f3bd62b3f` with scoped candidate diff SHA-256
`6478cc8a122f95a908fd91667b7cd891d33f776dcadbb465c9cb64087ea94370`.

Commands:

- `pnpm build` (fresh production build; Vite preview started on unused port 4174)
- `pnpm vitest run --config output/playwright/abi031-vitest.config.ts` (fixture generation, 1/1 pass)
- `$env:ABI031_BASE_URL='http://127.0.0.1:4174/autobattleidle/'; node output/playwright/abi031-visual-qa.cjs`
- `pnpm vitest run src/game/enemy-visual.test.ts` (22/22 pass)

Exact blocker from the single fresh browser run: `Error: Expected brute, got beetle`
at `output/playwright/abi031-visual-qa.cjs:130`. The harness starts the `armor-shield`
case with `expectedFamily: "brute"`, while the freshly generated production-codec
`output/playwright/abi031-armor-shield.json` resolves to the `beetle` family. The harness
therefore aborts before Hydra/Colossus motion quartets, repeated/overlapping hits, reduced
motion, family reloads, and health assertions can run; no candidate summary was produced.
This is an evidence-fixture/oracle defect, not a product defect claim. No harness retry or
product repair was performed. Existing ABI-031 artifacts and unrelated dirty files remain
untouched; exact-SHA Pages proof is not applicable until QA passes.

## Fresh candidate-bound rerun

PASS — the repaired candidate-bound QA harness completed the full assigned matrix.

Candidate identity:

- HEAD: `0b2850b006e241c4c15b84cc18372c2f3bd62b3f`
- Scoped candidate diff SHA-256: `6478cc8a122f95a908fd91667b7cd891d33f776dcadbb465c9cb64087ea94370`
- Local production preview: `http://127.0.0.1:4174/autobattleidle/`
- Candidate receipt: `output/playwright/abi031-candidate-summary.json`

Commands:

- `pnpm build` — fresh production build passed.
- `pnpm vitest run --config output/playwright/abi031-vitest.config.ts` — fixture generation passed, 1/1.
- `$env:ABI031_BASE_URL='http://127.0.0.1:4174/autobattleidle/'; node output/playwright/abi031-visual-qa.cjs` — exit code 0.
- `pnpm vitest run src/game/enemy-visual.test.ts` — focused visual suite passed, 22/22.

Acceptance matrix:

- Motion/effect cases: 7/7 passed — Hydra hit and critical desktop, Hydra critical narrow reduced-motion, Colossus hit and critical desktop, Colossus narrow reduced-motion, and armor-shield hit.
- Family reload cases: 8/8 passed — beetle, brute, wisp, mantis, sentinel, drake, boss-hydra, and boss-colossus identity/placement remained stable before and after reload.
- Every browser case reported zero console errors, zero failed requests, one canvas, and no layout overflow.
- Health assertions remained non-negative and the candidate summary recorded no failed assertions.
- Representative frame quartets and receipts were written under `output/playwright/abi031-*`; visual inspection confirmed bounded continuous hit/critical poses, readable attached/orbiting shields, and stable family placement.

This is independent QA evidence for the local candidate and does not claim exact-SHA CI, GitHub Pages, or deployed public proof; those remain Manager-owned closure gates. The prior fixture-oracle `CHANGES_REQUIRED` result above is preserved as historical evidence.
