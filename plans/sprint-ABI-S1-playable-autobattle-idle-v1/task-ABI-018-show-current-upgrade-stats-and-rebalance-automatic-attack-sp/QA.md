---
plannerFormat: 1
id: ABI-018
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018 qa

## Verdict

PASS — independent browser QA and focused regression evidence complete.

## Evidence

### Acceptance matrix

| Criterion | Result | Evidence |
| --- | --- | --- |
| Current stats panel exposes damage, armor penetration %, critical %, double reward %, APS | PASS | Desktop live snapshot `page-2026-08-29T13-58-49-467Z.yml`: dialog text `Damage: 12 · Armor penetration: 0.0% · Critical chance: 2.9% · Double reward: 5.5% · Automatic attacks: 0.10 APS`; dialog is role `dialog`, panel has aria label `Current upgrade stats`. |
| APS formula, monotonicity/bounds, progression and elite slow | PASS | `pnpm exec vitest run src/domain/combat.test.ts src/persistence/persistence-boundary.test.ts src/ui/hud.test.ts` — 3 files, 31 tests passed; full `pnpm check` — 14 files, 89 tests passed. |
| HUD APS while locked/unlocked and cooldown retained | PASS | Fresh desktop initial snapshot `page-2026-08-29T13-56-45-401Z.yml`: `Automatic attack: locked · 0.10 APS`. Seeded supported V3 reload snapshot `page-2026-08-29T13-58-39-311Z.yml`: `Automatic attack: 0.10 APS · 7.771s`; after purchase snapshot `page-2026-08-29T13-59-50-943Z.yml`: `Automatic attack: 0.12 APS · 6.011s`. |
| Automatic-speed purchase visibly changes APS | PASS | Initial seeded level 10 modal snapshot `page-2026-08-29T13-59-39-936Z.yml`: `Automatic attacks: 0.11 APS`, button `Automatic speed - 10`; click action -> `page-2026-08-29T13-59-50-943Z.yml`: level 11 and `Automatic attacks: 0.12 APS`, coins 1,000 -> 872 (automatic hits also observed). |
| Modal, pointer, keyboard basics | PASS | `Upgrades` click opens dialog; Escape closes (`true` hidden); `u` reopens; bubbling backdrop `pointerup` closes (`true` hidden). Upgrade buttons are native buttons with aria labels and disabled reasons. |
| Current and historical save reload continuity | PASS | Current V3 reload retained encounter/player progress (`page-2026-08-29T13-58-39-311Z.yml`). Invalid V3 + supported V2 fixture reload migrated without reset: `page-2026-08-29T14-01-15-156Z.yml` retained coins 7, enemy health 84/140, automatic unlocked, APS 0.10; storage then contained canonical V3. |
| Desktop/390px layout and overflow | PASS | At `http://127.0.0.1:4173/`, viewport 390x844, modal width 366px, document scrollWidth 390 = clientWidth 390, dialog remained usable; screenshot [abi018-390-modal.png](/C:/wrk/etherlords/autobattleidle/output/playwright/abi018-390-modal.png). |
| Console health | PASS | `playwright-cli console` after desktop and narrow flows: 0 errors, 0 warnings. |

### Exact scenarios and commands

- Started local app with `pnpm dev -- --port 4173`; verified `GET http://127.0.0.1:4173` returned 200.
- Used Playwright CLI against `http://127.0.0.1:4173` at desktop default viewport, then `resize 390 844`.
- Desktop: first load -> observed locked APS; click `Upgrades` -> inspected aria-readable stats; seeded a supported V3 state at level 10 -> reload -> click `Automatic speed` -> observed APS 0.11 -> 0.12 and cooldown; checked console.
- Narrow: Escape close -> `u` reopen -> backdrop pointerup close; evaluated `scrollWidth`, `clientWidth`, and dialog width; captured `output/playwright/abi018-390-modal.png`; checked console.
- Historical: set invalid V3 plus valid V2 fixture -> reload -> observed retained V2 progress and canonical V3 publication.
- `pnpm check` passed: lint, format check, Vitest 14/89, TypeScript build, Vite build. Existing Vite chunk-size warning only; no test/build failure.

### Scope and tools

- Files read: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/skills/webapp-testing/SKILL.md`, ABI-018 `BRIEF.md`, `ANALYSIS.md`, `IMPLEMENTATION-GUIDE.md`, `REVIEW.md`, `VERIFICATION.md`, `QA.md`, plus relevant UI/domain/persistence sources and fixtures.
- Tools: PowerShell, pnpm, Vite dev server, Playwright CLI real browser. No production code, dependencies, Planner lifecycle, Vault, Git, or other task packet was changed. Only this QA evidence body was updated.
- Elapsed: approximately 12 minutes wall-clock including checks and browser scenarios. Rework: none; no QA return was required. Blockers: none.
