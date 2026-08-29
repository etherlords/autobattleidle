---
plannerFormat: 1
id: ABI-007
artifact: implementation_guide
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

# ABI-007 implementation-guide

## Frozen scope

- Verify the complete shipped V1 release at the exact published SHA and produce canonical release evidence plus an evidence-derived project timeline.
- Product repair is limited to QA-confirmed release defects: family-aware names and identity, authored readability of the eight shipped enemy bodies and their existing decorations/modifiers, bounded hit/critical/death and shield/decor motion through the existing Unit/EnemyView lifecycle, and read-only canvas metadata needed to bind deployed receipts to rendered identity/effects.
- Combat balance, rewards, progression formulas, save schema, new families, new dependencies, runtime upgrades, worktrees, ABI-019, ABI-020, future Ready tasks, and unrelated artifacts are excluded.
- Acceptance layers: `unit/integration` for `pnpm check` and persistence fixtures; `deployed` for input, HUD, progression, enemy visuals, Golden Bug, effects, responsive layout, persistence, stability, and network/console behavior.

## Implementation sequence

1. Complete and record the read-only root audit, JIT preflight, acceptance layers, and no-schema classification.
2. Advance Ready -> In Progress only after canonical claim/plan readback.
3. Run focused/full local self-check and record the implementation-self-check gate.
4. Delegate an independent release-evidence review; repair once only if it finds a concrete defect.
5. Delegate independent deployed browser QA using production-valid fixtures and real input.
6. Update only accepted durable Vault release guidance when evidence changes it; otherwise record that no Vault content change is needed.
7. Record verification and actor-separated Manager closure, commit only ABI-007 code/Planner/Vault evidence, push through the native hook, and wait for exact-SHA CI/Pages/deployed proof.
8. Release the lease and run the final root audit without selecting a second task.

## Product-repair sequence

1. Share one exhaustive pure family/label selection policy between snapshot naming and `enemyVisualSpec`; add family/variant identity to the immutable presentation snapshot only.
2. Rework the existing body factories and owner-local configuration so every shipped family has a readable silhouette at desktop and 390px without exceeding current scene/resource bounds.
3. Replace generic attachment placement with family-owned anchors/rotations/scales; make shield/decor modifier cues visibly shield-like and boundedly orbit/levitate where specified.
4. Implement visible bounded spawn/hit/critical/death transforms and restoration through existing component commands/ticks; effects remain presentation-only and disposable.
5. Publish read-only canvas data attributes for current family, profile/seed, modifier, Golden Bug, active effect count, and last effect kinds. No mutable debug/test API is allowed.
6. Add focused deterministic tests, run `pnpm check`, then repeat independent review and full deployed QA before any gate is changed back to pass.

## Verification matrix

- Local: frozen dependency/runtime receipt; `pnpm check`; V1/V2/V3 persistence and malformed/future recovery tests; deterministic progression/visual/effect tests.
- Deployed input: pointer, Enter, Space exactly once; drag/cancel isolation; manual cooldown independence; auto lock/unlock/countdown/attack/reset and automatic-only slow.
- Deployed UI: passive HUD, current/max HP, coins, bounded six-entry log, upgrades modal/focus/keyboard/backdrop, desktop and 390px, no page scroll.
- Deployed progression: repeatable purchases, grades/modifiers, multiple bosses, authored deterministic visuals, Golden Bug kill/escape/reward/reload rules, numeric stability.
- Deployed effects/stability: distinct cues, reduced motion, bounded effects/resources/listeners/RAF, clean console and healthy assets/network.
- Release: exact commit, CI run, Pages run, public URL, deployed asset names/SHA association, accurate Planner-derived timeline, unresolved debt.

## Independent deployed QA cases

All browser storage inputs are generated and decode/re-encode validated through production
`createCombatState`, `spawnEnemy`/`spawnGoldenBug`, and `encodeSave`/`decodeSave`; never hand-author
a save payload. Retain the JSON receipt, screenshot, console/network capture, and one result row per
case under `output/playwright/abi007-*`.

Independent QA runs before closure against the then-current published build and records its deployed
SHA/URL; it supplies the independent-qa gate only and is not exact-closure-SHA proof. The Manager alone
performs the separate post-push recheck in the Exact-SHA release binding procedure below.

| Criterion | Production-valid fixture/source | Action and time | Exact oracle | Viewport | Retained artifact |
| --- | --- | --- | --- | --- | --- |
| Manual/automatic combat | Codec V3 starter, locked and unlocked automatic states | Pointer, Enter, Space once each; drag/cancel; observe unlock countdown through zero and one restart | Each manual input changes HP once and leaves `nextAutomaticAttackAtMs` unchanged; at each supported viewport the container remains approximately 35-45vw (source `clamp(11rem, 40vw, 32rem)`), while only the fill decreases to zero, triggers exactly one automatic attack, and resets; only automatic-slow changes that countdown | 1280x800 and 390x844 | `abi007-input-auto.{json,png}` |
| HUD, modal, and layout | Codec V3 starter plus upgrade-rich V3 state | Open/close modal by pointer, keyboard, and backdrop; buy repeatable upgrades; resize | Enemy name/level/grade/modifier, accessible current/max HP, coins, six-or-fewer log entries, focus return, no page scroll, and no passive-HUD interception | 1280x800 and 390x844 | `abi007-hud-modal.{json,png}` |
| Progression and Golden Bug | Codec V3 states from `spawnEnemy` for armored/modifier/boss encounters and `spawnGoldenBug` for kill/escape | Execute purchases, kill multiple bosses, run Golden Bug to click-kill and 10.5s escape, reload each result | Increasing repeatable level/cost, armor penetration and safe values, boss progression; kill gives the canonical large reward, escape gives zero and resumes encounter; an active Bug reload preserves identity/resume state, omits the old deadline, and reconstructs a fresh deadline | 1280x800; escape also 390x844 | `abi007-progression-golden.{json,png}` |
| Every body, modifier, and seeded decoration across reload | Production `enemyVisualSpec` inputs covering `brute`, `wisp`, `beetle`, `mantis`, `sentinel`, `drake`, `boss-colossus`, `boss-hydra`; modifiers `armor`, `health`, `automatic-slow`, `wealth`, `hardened`, `critical-guard`, `manual-guard`; deterministic decorations `fins`, `horns`, `orbitals`, `satellites`, `scar` | Capture each family/profile variant, reload, then recapture the same seeded state | Named body, grade/modifier attachment, decoration set, and seed/profile variant match before/after reload; no family exceeds the bounded visual tree | 1280x800 | `abi007-visual-families.{json,png}` |
| Every named effect and reduced motion | Production codec V3 cases that emit `spawn`, `hit`, `armor`, `critical`, `death`, `coin`, `boss`, `golden-kill`, and `golden-escape` | Trigger each cue once; repeat to cap/expire; repeat with `prefers-reduced-motion: reduce` | Each named cue is visibly distinct; reduced motion does not grow; effect count/resources/listeners/RAF remain bounded and simulation outcome is unchanged | 1280x800; reduced-motion 390x844 | `abi007-effects.{json,png}` |
| Persistence and health | Authentic V1/V2 fixtures, codec V3 current state, malformed JSON/shape, future version, and reset confirmation | Load -> migrate -> save -> reload for V1/V2; reload V3; load malformed/future; cancel then confirm reset | V1/V2 source bytes remain intact while V3 reloads; V3 reloads; malformed/future safely fall back without overwrite; cancel preserves save and confirmed reset removes only current valid progress | 1280x800 | `abi007-persistence-health.{json,png}` |

Every case also records `errors: []`, failed-network count `0`, canvas count `1`, body bounds no larger
than its viewport, resource/heap samples, and closed context/browser confirmation. A case may reuse a
single production-codec fixture only when its result receipt identifies every criterion and oracle above.

## Exact-SHA release binding

1. After the ABI-007 closure checkpoint is pushed, resolve `closureSha` from `origin/main` and retain
   its full SHA.
2. Query CI and Pages by that SHA; retain each run ID and URL only when its `headSha === closureSha` and
   conclusion is `success`.
3. Wait for the matching Pages run to complete; do not treat a later deployment or HTTP 200 as evidence
   for `closureSha`.
4. The Manager then runs the separate post-push exact-closure-SHA deployed recheck against that Pages
   URL; it is not the pre-closure independent-qa gate. Record final URL, observed deployed JS/CSS asset
   names, SHA/run IDs, case receipts, and console/network results in `VERIFICATION.md`; this is the
   post-deploy binding.

## Canonical project timeline

`VERIFICATION.md` is the sole user-facing timeline location. Derive rows only from Planner activity and
use this schema: `task | status | gate verdict | actor | UTC timestamp | evidence receipt | unresolved debt`.
Include completed gates and any current non-blocking debt; use `none` rather than inferring an outcome.
