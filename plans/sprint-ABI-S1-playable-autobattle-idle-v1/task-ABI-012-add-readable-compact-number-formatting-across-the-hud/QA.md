---
plannerFormat: 1
id: ABI-012
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-012 qa

## Verdict

PASS — independent local/integration browser QA. Deployed proof is manager-owned after publication.

## Evidence

- Focused formatter/HUD/presenter tests: 18/18 pass. Full `pnpm check`: lint, format, 65/65 tests, TypeScript, and Vite build pass.
- Desktop 1440x900: a valid persisted high-encounter v2 save rendered `1.16T / 1.16T`, `7M` coins, compact prices, and `910K` combat logs without horizontal overflow.
- Narrow 390x844: the same production render path remained readable and `scrollWidth === innerWidth`.
- Pointer attack reduced HP and appended `Manual hit: 910K damage`; Upgrades focused Close on open and Escape closed it.
- HP retained exact `aria-valuenow`, `aria-valuemax`, accessible label, and title. Upgrade labels/titles retained grouped exact values.
- The valid v2 save loaded, gameplay updated it, and reload restored persisted state. Timers retained duration formatting.
- Console errors/warnings: zero. App requests: HTTP 200. Local artifacts: `.playwright-cli` plus QA screenshots captured during the run.
- Deployed Pages proof was not claimed and remains required against the exact pushed SHA.

## Deployed repetition

- PASS at `https://etherlords.github.io/autobattleidle/` for published SHA `4e4c6e9a7341adaa9b596305a595acad14bfd339`; Pages run `33222069018` completed successfully.
- Desktop 1440x900 and narrow 390x844 repeated high-value HP, both coin surfaces, two-line prices, compact damage logs, exact ARIA/title values, pointer/Enter/modal actions, valid v2 update-reload, duration timer, and zero horizontal overflow.
- Console errors/warnings: zero. Deployed document, JavaScript, CSS, and favicon requests: HTTP 200.
- Artifacts: `output/playwright/abi012-deployed-desktop.png` and `output/playwright/abi012-deployed-390.png`.
