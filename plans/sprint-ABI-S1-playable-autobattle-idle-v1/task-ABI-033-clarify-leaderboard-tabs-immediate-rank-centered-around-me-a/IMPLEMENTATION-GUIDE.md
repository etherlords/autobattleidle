---
plannerFormat: 1
id: ABI-033
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-032
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-033 implementation-guide

## Frozen scope

- UI/API presentation follow-up only: no D1 migration and no ranking formula change.
- Metric row order is Level, Golden Bugs. View row order is Top 100, Around Me.
- Switching metric retains the selected view.
- Around Me radius is ten above and ten below, with the authenticated player highlighted.
- Summary copy is `Community ranking — Your rank is #N`; entries contain one place value only.

## Implementation sequence

1. Add a repository/service result that returns Top entries and the authenticated player's ranked
   entry; split Top and Around limits.
2. Restructure `LeaderboardDialog` into close, metric tabs, view tabs, rank summary, and semantic
   table; retain current view on metric changes.
3. Add compact responsive CSS, selected tab states, and current-row highlighting.
4. Update focused Worker/client/HUD tests, then run `pnpm check`.
5. Run independent review and deployed browser QA at desktop and 390px.

## Verification matrix

- Unit: Top payload includes `me`; Around returns at most 10/1/10 and correct ranks near edges.
- DOM: control order/groups, table headers/cells, no `#rank` duplication, selected tabs, current-row
  class/label, and close/backdrop/Escape/focus behavior.
- Responsive: aligned columns at desktop and 390px without clipping.
- Deployed: first open shows rank immediately; both metrics and both views work against production
  data with clean console/network.
