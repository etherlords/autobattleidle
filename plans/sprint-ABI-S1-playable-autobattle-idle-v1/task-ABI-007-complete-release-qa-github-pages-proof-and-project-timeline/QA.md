---
plannerFormat: 1
id: ABI-007
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007 qa

## Verdict

BLOCKED — the seven original and bounded extension scenarios pass against the
published build at `5a1b1eaec70a64e7906795886e44f557b9c09665`, but the frozen
deployed matrix cannot fully pass because several required browser oracles are
not exposed. This is not the Manager's later exact-closure-SHA recheck.

## Acceptance matrix

| Area | Exact scenario and oracle | Result / receipt |
| --- | --- | --- |
| Manual input and cooldown independence | Production V3 armor fixture, 1280x800; focus canvas and press Enter then Space once; HP must decrement once per input and locked auto state must remain unchanged | PASS: `282/282 -> 280/282`, locked `0.10 APS`; `output/playwright/abi007-input-desktop.json/.png` |
| HUD/modal/narrow layout | Production V3 critical fixture, 390x844; inspect HUD, open Upgrades, Escape close; no overflow or passive HUD interception | PASS: stable HUD, modal action completed, `scrollWidth=390`, one canvas, no errors; `abi007-hud-modal-narrow.json/.png` |
| Boss/death/reward progression | Production V3 boss fixture, 1280x800; one Enter kills `1/1,500`, rewards and next encounter must appear | PASS: next Level 36 elite rendered, coins `420`; `abi007-boss-transition.json/.png` |
| Golden Bug kill | Codec-generated active Bug fixture, 1280x800; one Enter kills and grants canonical reward | PASS: Bug -> next encounter, coins `1,220`; `abi007-golden-kill.json/.png` |
| Golden Bug escape and reduced motion | Same authentic active Bug fixture, 390x844 with reduced motion; wait 10.5s | PASS: Bug expired, resumed Level 51 encounter, coins remain `0`, no console errors; `abi007-golden-escape-reduced.json/.png` |
| Active V3 reload deadline | Authentic active Bug fixture; reload and compare identity/resume state, with deadline reconstructed rather than persisted | PASS: identity/resume preserved, timer reconstructed (`9.3s -> 9.0s`), stored payload has no deadline; `abi007-golden-reload-transition.json`, `abi007-golden-reload.json/.png` |
| Persistence recovery | Invalid V3 JSON plus authentic V2 and V1 fixture sources; reload and observe preserved V2 state | PASS: `84/140`, 7 coins, auto `0.10 APS` retained and active; `abi007-persistence-recovery.json/.png` |
| Visual/effect contracts | Focused production tests covering all body/grade/modifier/decorations and named effect behavior | PASS: 38/38 in `pnpm vitest run src/game/enemy-visual.test.ts src/game/battlefield.test.ts src/game/battlefield/effects.test.ts src/persistence/persistence-boundary.test.ts` |
| Full local gate | `pnpm check` from repository root | PASS: lint, Prettier, 15 files/93 tests, TypeScript, Vite build; existing 594 kB chunk advisory only |
| Network/console/stability health | Every browser context records failed requests, console error/warning, one canvas, body bounds and resource count | PASS: all seven cases `errors=[]`, `failed=[]`, one canvas, no viewport overflow; `abi007-summary.json` |

## Published build and assets

- URL: `https://etherlords.github.io/autobattleidle/`
- Published `origin/main`: `5a1b1eaec70a64e7906795886e44f557b9c09665`
- Loaded assets: `assets/index-Dl6ZkpHF.js`, `assets/index-Bv0br866.css` (HTTP 200).
- Browser: real Chromium through Playwright module at the configured CUA runtime.
- Viewports: 1280x800 and 390x844; reduced-motion case used 390x844.
- Fixtures: existing codec-generated ABI-011 V3 fixtures and repository V1/V2 fixtures; no hand-authored save payloads.

## Commands and files

- `node output/playwright/abi007-qa.cjs`
- `pnpm vitest run src/game/enemy-visual.test.ts src/game/battlefield.test.ts src/game/battlefield/effects.test.ts src/persistence/persistence-boundary.test.ts`
- `pnpm check`
- Directly read: `AGENTS.md`, `.agents/AGENTS.md`, `.agents/skills/webapp-testing/SKILL.md`, ABI-007 `BRIEF.md`, `IMPLEMENTATION-GUIDE.md`, `REVIEW.md`, `VERIFICATION.md`, `PROGRESS.md`, `.docs/knowledge/quality/Testing Strategy.md`, `.docs/knowledge/architecture/Persistence Contract.md`, `.docs/knowledge/design/UI, Persistence, and QA.md`, relevant production codec/combat/visual/effect files and fixtures.
- QA-owned artifacts: `output/playwright/abi007-qa.cjs`, `abi007-*.json`, `abi007-*.png`.
- Elapsed: approximately 9 minutes including browser runs and focused/full checks. No product source, Planner, Vault, dependency, Git, runtime, or existing ABI-011 artifact was modified.

## Scope note

Browser fixtures visibly exercised the published Wisp family and all release-critical
combat/UI/event transitions. The focused production visual/effect tests independently
cover the full deterministic body/modifier/decorations contract; the Manager must still
perform the separate post-push exact-closure-SHA deployed recheck and record its own
asset/SHA/Pages receipts.

## Bounded extension and exact blocker

The requested fresh extension generated production-codec fixtures for all shipped body
families (`beetle`, `brute`, `wisp`, `mantis`, `sentinel`, `drake`, `boss-hydra`, and
`boss-colossus`) and captured each public canvas before/after reload. It also added browser
V1 migration and future-version/reset attempts. Receipts are `abi007-visual-*.json/.png`,
`abi007-persistence-v1-migration.json`, and `abi007-future-reset-transition.json`.

Exact blocker: the published build exposes no browser-observable selector, accessible
identity, effect counter, or deterministic automation control for all requested acceptance
oracles. Every generated non-Wisp fixture renders the same public `Ash Wisp` HUD identity;
there is no production UI/API to assert the selected canvas body, attachment, decoration,
or effect kind. Likewise, the public UI has no control to force the unlocked automatic
countdown/fill sequence, each modifier roll, all named effects individually, or repeated
multi-boss progression in a bounded deterministic run. Therefore this extension cannot
truthfully claim the frozen deployed matrix from screenshots or unit tests. Result for the
unobservable portions is `BLOCKED`, not substituted PASS: product instrumentation or a
production-valid fixture route exposing these state/oracle boundaries is required before
deployed QA can complete. No product code was changed by QA.

Missing deployed oracles, explicitly:

- Input/automatic: stationary-versus-drag/cancel distinction, both Enter/Space exactly-once
  paths at both viewports, unlocked countdown/fill-to-zero/reset, and automatic-slow-only
  countdown change.
- Visuals: publicly assertable recognizability, attachment/decorations, and variant identity
  for every body before and after reload.
- Effects: individually force and observe spawn, hit, armor, critical, death, coin, boss,
  golden-kill, and golden-escape cues plus bounded expiry/resource counts under reduced motion.
- Progression: deterministic repeatable purchases, all modifiers, several bosses, and
  multiple-boss progression in one bounded browser run.
- Persistence/reset: byte-preserving V1 -> V2 -> V3 and V2 -> V3 browser chains, plus
  separate malformed-shape/future-version recovery and cancel-then-confirm reset proof.

## Fresh local production-preview run

Fresh run command:

`$env:ABI007_BASE_URL='http://127.0.0.1:4173/autobattleidle/'; node output/playwright/abi007-qa.cjs`

The production preview served the repaired visual identity: browser receipts visibly
reported Cinder Beetle, Ember Brute, Ash Wisp, Thorn Mantis, Prism Sentinel, Ash Drake,
Cinder Hydra, and Ember Colossus. Each had before/after reload canvas screenshots and zero
console/request failures. Pointer/keyboard combat, boss transition, Golden Bug kill/escape/
reload, V1/V2 recovery, malformed/future fallback, 1280x800/390x844 layout, reduced motion,
and one-canvas/no-overflow checks passed. Receipts are `output/playwright/abi007-summary.json`,
`abi007-visual-*.json/.png`, `abi007-golden-*.json/.png`, and persistence receipts.

Fresh verdict remains `BLOCKED` for the same exact deployed-matrix boundary: this bounded
route does not yet force and record every pointer drag/cancel and unlocked automatic
fill-to-zero/slow oracle, every named effect individually with resource/expiry counts,
repeatable purchases plus several-boss progression, or byte-preserving V1->V2->V3 and
cancel-then-confirm reset as separate browser transitions. These are not inferred from
screenshots or unit tests. The local preview is also not exact-closure-SHA evidence; after
push, Manager must run the required CI/Pages SHA match and post-deploy recheck.

## Final independent rerun

Command: `$env:ABI007_BASE_URL='http://127.0.0.1:4173/autobattleidle/'; node output/playwright/abi007-qa.cjs`.

The rerun reached the repaired expanded harness and immediately stopped at the deterministic
Boss 70 case with `Error: Boss 70 did not progress` (`abi007-qa.cjs:272`). This is a harness
oracle failure, not a product PASS: the prior retained Boss 70 receipt shows the same action
did produce `Ember Colossus Level 70 -> Ash Wisp Level 71` and effects `death, coin, boss`,
but the current assertion compares `.hud-status h1`, which is not the full identity transition.
No new receipt was written after that failure. Final QA verdict is therefore `BLOCKED` pending
correction of the harness oracle and a fresh complete run; no harness or product file was
changed by QA. Existing successful receipts remain valid partial evidence. Exact-closure-SHA
CI/Pages and Manager post-push proof remain separate and outstanding.

## Final independent QA rerun after harness repair

Command: `$env:ABI007_BASE_URL='http://127.0.0.1:4173/autobattleidle/'; node output/playwright/abi007-qa.cjs`

PASS — all 21 scenarios completed with exit code 0. Boss 70/105 input fixtures are separate
(`output/playwright/abi007-boss-fixture-{70,105}.json`) from receipts
(`output/playwright/abi007-boss-{70,105}.json`). Summary validation reports `count=21`,
`bad=0` for console errors, failed requests, and viewport overflow.

Fresh receipts cover pointer tap/drag/cancel, Enter/Space, normal and slow automatic
countdown/fill/reset with manual independence, effect traces and <=12 active effects,
upgrade/modal behavior, Boss 35/70/105 transitions, Golden Bug kill/escape/reload,
V1/V2/malformed/future/reset paths, all eight visual families before/after reload,
desktop/narrow/reduced-motion contexts, one canvas, and network/console health.

This PASS is independent QA against the local candidate preview only. Exact-closure-SHA
CI/Pages matching and the post-push deployed recheck remain Manager-owned.
