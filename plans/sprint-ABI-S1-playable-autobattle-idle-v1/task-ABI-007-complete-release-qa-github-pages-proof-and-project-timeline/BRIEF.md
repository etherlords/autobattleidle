---
plannerFormat: 1
id: ABI-007
artifact: brief
project: ABI
profile: high-assurance
revision: 3
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
  - ABI-010
  - ABI-011
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007: Complete full feature release QA, Pages proof, and project timeline

## Goal

Complete release QA, GitHub Pages proof, and project timeline

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] pnpm check passes from the supported clean dependency workflow and the exact main commit, CI and Pages receipts are recorded
- [ ] A deployed browser proves canvas and Enter/Space attacks are exactly-once, passive HUD elements do not intercept input, and manual attacks never change automatic cooldown
- [ ] The fixed top enemy/HP/35-45% automatic/coins overlay, lower-right bounded log, no-page-scroll layout, and lower-left upgrades modal work at desktop and 390px narrow widths
- [ ] Deployed progression proves indefinitely repeatable upgrade levels, armor penetration, meaningful high-level purchases, armored enemy viability, several bosses, and numeric stability evidence
- [ ] Every enemy archetype, boss body, modifier attachment and seeded decoration is recognizable, deterministic across reload, and bounded during a long run
- [ ] A deployed Golden Bug proves timed spawn, auto-only failure, active-click success, exact kill or escape, large reward, persistence rule, and metallic visual identity
- [ ] Ordinary, armored, critical, death, reward, boss, and Golden Bug effects are distinct, reduced-motion compatible, bounded, and never alter simulation outcomes
- [ ] Persistence save/reload, malformed/unsupported recovery, confirmed reset, network health, responsive layout, and zero blocking console errors pass on Pages
- [ ] Planner evidence generates an accurate user-facing project timeline with gate outcomes and unresolved non-blocking debt


- [ ] pnpm check passes from a clean dependency state
- [ ] A real browser run proves deployed manual click and keyboard attacks reduce HP immediately without changing the automatic cooldown
- [ ] A real browser run proves the automatic attack locked state, unlock, seconds-and-milliseconds countdown, progress-to-zero attack, cooldown restart, and automatic-only slow behavior
- [ ] The deployed large enemy HUD shows name, encounter level, grade, modifier, and a shrinking accessible current/max HP bar on desktop and narrow viewports
- [ ] The deployed bounded lower-right log reports kill rewards and remains stable without unbounded entries during a long-run scenario
- [ ] A real browser run proves upgrades, grades, bosses, persistence, malformed-save recovery, reset, responsive layout, and continued progression past multiple bosses
- [ ] The GitHub Pages build is playable without blocking console errors and its exact deployment receipt and public URL are recorded
- [ ] Planner evidence produces a user-facing visualization of project progress and gate outcomes

## Dependencies

- ABI-006
- ABI-008
- ABI-009
- ABI-010
- ABI-011


- ABI-006

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F


- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
