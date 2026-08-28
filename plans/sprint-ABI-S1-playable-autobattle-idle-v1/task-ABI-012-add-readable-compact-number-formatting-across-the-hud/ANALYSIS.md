---
plannerFormat: 1
id: ABI-012
artifact: analysis
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

# ABI-012 analysis

## Verified current state

- ABI-023 is Done at revision 10; ABI-006, ABI-008, and ABI-015 are also Done. ABI-012 is dependency-ready and leased by `root-manager` for this finite turn.
- `BattleStatus` renders raw enemy level, HP, and passive coins. `UpgradeDialog` separately renders raw modal coins, levels, costs, disabled reasons, accessible labels, and titles. `EventLog` receives already assembled strings from `app/battle/presenter.ts`.
- No shared number formatter exists. Timers already have separate duration rendering and stay unchanged.
- Vault `AUTOBATTLEIDLE-DOC-20260828-C8B5AA` is the active authority: exact grouping through 9,999, explicit suffixes from 10,000, three significant digits, suffix promotion, safe em dash for invalid input, and exact accessible text.

## Approach

- Add one dependency-free `src/ui` formatter returning visible and grouped exact text. Use a fixed suffix table and scientific fallback; do not use locale compact notation.
- Use the formatter only at UI presentation seams. Keep domain snapshots, combat math, timers, and persisted values exact and unchanged.
- Preserve exact progressbar numeric attributes; add grouped exact accessible labels/title where compact visible text is used. Format numeric combat events before they become log strings rather than parsing assembled prose.
- Acceptance layers: formatter boundaries are unit; HUD/presenter integration, accessibility, and historical-save load/reload are integration; desktop and 390px behavior plus deployed Pages are deployed.
- Persistence impact: no schema change. Existing v1/v2 historical-save load/reload coverage must remain green.

## Risks

- Rounding near a suffix boundary can emit `1000K`; promote after rounding.
- Locale compact notation can start at 1,000 or change suffixes; only exact grouping may use a fixed locale.
- Replacing exact ARIA numeric attributes with compact text would regress accessibility; retain raw numeric attributes and add exact names/title.
- Parsing existing log strings would duplicate ownership and be brittle; presenter-owned numeric interpolation must call the shared formatter directly.
