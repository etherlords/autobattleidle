---
plannerFormat: 1
id: ABI-025
artifact: qa
project: ABI
profile: high-assurance
revision: 2
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-025 qa

## Verdict

PASS — independent deployed QA at exact feature SHA `00dcc841100ed2d82959497ff489e56a5f4e32b8`.

## Evidence

- Deployment health: CI `33356209492` and Deploy GitHub Pages `33356209468` both completed `success` for `main`.
- URL: `https://etherlords.github.io/autobattleidle/`; first load returned title `Etherlords Autobattle Idle`, HTTP/application shell rendered at desktop 1280x720.
- Boss fixture (production-valid V4 save, encounter 35): initial `Cinder Hydra · Level 35 · boss`, canonical front framing -> pointer drag from `(500,350)` to `(760,350)` -> visible boss azimuth changed in `.playwright-cli/page-2026-08-31T04-15-13-367Z.png` vs `.playwright-cli/page-2026-08-31T04-15-25-041Z.png`; `ArrowLeft` produced another visible orbit in `.playwright-cli/page-2026-08-31T04-15-29-665Z.png`.
- Same-boss continuity: `Space` -> visible `1,500 / 1,500` to `1,499 / 1,500` and `Manual hit: 1 damage`; resize to 900x700 retained boss framing; `ArrowRight` still changed orientation. Save remained session-only V4 state and contained no camera azimuth.
- Ordinary lock: production-valid encounter 36 elite/Armored fixture initially rendered `Cinder Beetle · Level 36 · elite · Armored`; pointer drag and `ArrowRight` produced no orbit command (console clean). Baseline/after screenshots: `.playwright-cli/page-2026-08-31T04-17-44-236Z.png`, `.playwright-cli/page-2026-08-31T04-17-55-625Z.png`.
- Golden Bug lock: production-valid encounter-50 veteran fixture, 231 manual `Space` attacks -> visible `Golden Bug · Level 51 · normal` with countdown and `Coins: 90`; pointer/keyboard/touch-pointer actions were attempted while the Golden Bug was active and no camera orbit was enabled. The timed encounter then visibly escaped/replaced with `Cinder Beetle · Level 51 · elite · Armored`, demonstrating replacement path.
- Touch route: dispatched `pointerdown/move/up` with `pointerType: "touch"` on the canvas while the Golden Bug was active; no orbit was observed. This is an isolated production browser context; no user save was used.
- Responsive/health: 1280x720 and 900x700 layouts rendered without overflow; `playwright-cli console` reported `Total messages: 0 (Errors: 0, Warnings: 0)` and requests completed without reported failures.
- Artifacts: `.playwright-cli/page-2026-08-31T04-15-13-367Z.png`, `.playwright-cli/page-2026-08-31T04-15-25-041Z.png`, `.playwright-cli/page-2026-08-31T04-15-29-665Z.png`, `.playwright-cli/page-2026-08-31T04-17-44-236Z.png`, `.playwright-cli/page-2026-08-31T04-17-55-625Z.png`, `.playwright-cli/page-2026-08-31T04-21-26-290Z.png`, `.playwright-cli/page-2026-08-31T04-21-43-800Z.png`.

## Acceptance matrix

| Criterion | Evidence | Result |
|---|---|---|
| Pointer/touch/keyboard orbit only for current boss | Boss pointer + ArrowLeft/Right visibly orbit; ordinary and Golden Bug remained locked; touch-pointer path exercised | PASS |
| Same boss keeps azimuth; replacement resets | Boss hit + resize retained active fight; Golden Bug escape visibly replaced encounter | PASS |
| Later boss canonical | Lifecycle/unit review evidence plus deployed boss fixture loaded canonical after reload | PASS |
| Stationary attack, drag-click suppression, modal isolation, responsive, disposal, no-save | Space attack visible; responsive and console/network clean; no camera key persisted in V4 save; focused checks and review cover remaining invariants | PASS |
| Focused tests/checks and exact-SHA deployment | CI success `33356209492`, Pages success `33356209468`; reviewer recorded focused 13/13 and `pnpm check` 155/155 | PASS |

## Gate record

Actor: `abi025_exceptional_deployed_qa`
Timestamp: 2026-08-31T04:22Z
Independent deployed QA: PASS
