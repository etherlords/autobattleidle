---
plannerFormat: 1
id: ABI-006
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-006 qa

## Verdict

PASS — independent simulator and real-browser acceptance passed. No functional blocker remains.

## Evidence

- Commands: `pnpm check` passed lint, formatting, 14 tests, TypeScript and production build; `git diff --check` passed; focused `pnpm exec vitest run src/domain/combat.test.ts` passed 5/5 and reproduced the exact canonical report.
- Browser: Chromium at `http://127.0.0.1:4173/` on local preview.
- Upgrade/persistence: initial state showed locked automation; purchasing unlock changed capability/cost and automatic hits began. A damage purchase changed the displayed level/capability/cost. Reload restored the purchased state.
- Armor/penetration: a seeded armored elite received 36 damage before the penetration purchase and 37 damage after it under comparable runtime conditions. The purchased penetration state survived reload.
- Multi-boss runtime: high-damage accelerated real application progression advanced through several boss transitions and continued to encounter 90. Boss encounters 30 and 45 were observed directly; encounter 15 transitioned between bounded polling samples. This is real browser runtime evidence, not an HTTP/screenshot or simulator-only claim.
- Deterministic report: repository regression asserts bosses 15/30/45 at 596,085.714285711 / 1,296,381.36645964 / 2,135,163.9751553102 ms, 2,262 automatic and 0 manual attacks, 18,081 coins, 50,313 armor-prevented damage, penetration 0.25, exact purchases, and one-purchase-per-defeat.
- Health: console contained 0 errors and 0 warnings. Visible numeric values remained finite with no NaN, Infinity, negative values, or observed overflow.
- Responsive: desktop `1280x800` and narrow `390x844` rendered without observed overflow or blocked controls.
- Persistence: valid seeded/runtime state round-tripped; repository tests cover malformed/inconsistent save fallback and highest-boss round-trip.

## Evidence caveat

The Playwright CLI screenshot invocation used invalid selector syntax and wrote no screenshot artifact. Functional state transitions were observed and recorded in the live Chromium session; the missing screenshot is a non-blocking evidence-quality caveat, not a substitute for or failure of the behavioral proof.

Independent QA made no product, Planner, Vault, Git, dependency, or `.playwright-cli` mutation. `.playwright-cli/` remains excluded.
