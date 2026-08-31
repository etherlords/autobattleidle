---
plannerFormat: 1
id: ABI-032
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-013
  - ABI-030
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-032 verification

## Acceptance evidence

- The public leaderboard exposes independent Level and Golden Bugs modes with Top and Around Me;
  the deployed QA dataset contains 40 visible players and varied metrics in both rankings.
- Golden Bug defeats are cumulative domain state in save V4. Lethal, escape, and historical
  V1/V2/V3 migration behavior is covered deterministically; older saves initialize the unknowable
  historical total to zero without rewriting their source bytes.
- Remote D1 migration `0002_golden_bugs.sql` completed against
  `bb93d778-d7e2-4c47-b788-64f1df1b288b`; the repair deployment found no pending migration.
- The Worker accepts one `{ level, goldenBugs }` snapshot and maintains independent monotonic maxima.
- Scheduler tests prove boss-or-five-minute submission, success reset, one in-flight request,
  coalescing, retained dirty state after failure, and bounded retry. Deployed gameplay proved that an
  ordinary level increase emits no score request.
- Worker ownership is routes -> handlers -> services -> repositories -> Drizzle/D1. Production code
  contains no direct `env.DB.prepare`.
- `pnpm check` passed with 20 test files and 147 tests. Independent review passed after the deployed
  D1 INSERT repair.
- Deployed desktop and 390x844 browser checks passed with successful identity/ranking responses,
  visible current rank, no clipping, and zero console errors or warnings.

## Exact release

- Git SHA: `a7b34c3b501fd891a9c1d120c05b65a1b5320d0f`
- CI: `33347871511` — success
- Pages: `33347871496` — success
- Worker: `33347871505` — success
- Worker version: `1834553a-7e67-42a9-8b4f-d0b1dba864e8`
- Pages URL: `https://etherlords.github.io/autobattleidle/`
- Worker URL: `https://autobattleidle-leaderboard.etherlords.workers.dev`

## Sign-off

- Reviewer: PASS
- QA: PASS
- Manager close: PASS
