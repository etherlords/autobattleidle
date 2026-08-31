---
plannerFormat: 1
id: ABI-033
artifact: analysis
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

# ABI-033 analysis

## Verified current state

- `LeaderboardDialog` appends controls in Close, Top, Around, Level, Golden Bugs order, so the two
  conceptual tab groups are visually mixed.
- Entries use an ordered list while each row also renders `#rank`, producing `1. #1` duplication.
- Top returns only `entries`; Around returns `entries` plus `me`, so own rank is unavailable on first
  Top load.
- Around currently requests up to 100 above and 100 below, which is larger than the requested
  centered local context.
- Backdrop click, Escape, focus restoration, and focus trapping already exist and must remain.

## Approach

- Keep deterministic ranking and privacy unchanged.
- Return `me` with Top by adding one bounded rank query for the authenticated player.
- Split Top limit 100 from Around radius 10; Around therefore returns at most 21 rows and preserves
  correct edge behavior.
- Render two labelled tab groups followed by an always-present rank summary and a semantic table with
  Place, Name, and mode-specific Value columns.
- Mark the current row by matching `entry.rank` to `view.me.rank`; use both visible styling and an
  accessible row label.
- Use a compact `×` button at the top-right while keeping all existing dismissal paths.

## Risks

- Top gains one bounded count query; the 10,000-player ceiling keeps its cost explicit.
- Rank alone is sufficient to identify the current row because each ranking has exactly one entry per
  rank under deterministic tie-breaking.
- Narrow layouts must prevent name/value overlap without hiding place or current-player highlighting.
- No schema, save, identity, score, or ranking-order change is permitted.
