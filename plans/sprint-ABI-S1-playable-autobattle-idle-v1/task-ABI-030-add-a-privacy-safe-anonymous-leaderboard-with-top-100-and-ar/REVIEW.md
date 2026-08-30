---
plannerFormat: 1
id: ABI-030
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-012
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-030 review

## Verdict

CHANGES_REQUIRED — independent review completed after a fresh `pnpm check` (137 tests,
Worker strict TypeScript, application build) and `git diff --check` pass. Green checks do not
cover the material release, concurrency, retention, modal, collision, and query-cost defects below.

## Findings

1. **P0 — production is not configured.** Pages builds without `VITE_LEADERBOARD_API`;
   `wrangler.toml` retains a D1 placeholder and supplies neither `ALLOWED_ORIGINS` nor the
   `IP_HASH_KEY` secret. The public feature is therefore offline and the Worker is not deployable.
2. **P1 — rate limits are concurrency-bypassable.** `permitted()` performs a `SELECT` followed by
   separate UPSERT statements; parallel requests can all observe count 19 and pass before increments.
3. **P1 — reset leaves retained hashes and unbounded expired rows.** Deletion removes the player but
   not the identity-derived rate-limit row; expired network rows are never pruned.
4. **P1 — keyboard modal exclusivity is broken.** Opening Leaderboard and pressing `U` can leave both
   Leaderboard and Upgrades open as `aria-modal` dialogs.
5. **P1 — generated names are not collision-safe.** A six-hex-character suffix can collide with the
   unique display-name constraint; create and rename have no retry or forced-collision proof.
6. **P2 — Around Me cost is not bounded.** The returned window is bounded, but exact rank uses an
   unbounded `COUNT(*)`; ranking reads are also unlimited.
7. **P2 — operational/adversarial proof is incomplete.** The suite needs concurrent rate-limit,
   forced collision, CORS preflight, retention cleanup, keyboard shortcut, real D1/migration, and
   configured Pages/Worker deployment evidence.

## Required repair

Return once to the implementation owner. Make the Worker entrypoint readable by separating routing,
HTTP/auth/name/rate-limit policy, and D1 repository responsibilities without adding a framework or
speculative abstraction. Repair every finding above, extend focused tests, rerun `pnpm check`, then
run one fresh independent re-review before QA.

## Fresh re-review

CHANGES_REQUIRED — the single bounded repair closed the original Pages/D1 guard, rate-limit,
retention, name-collision, read-cost, CORS, modal-visibility, test, and Worker-responsibility findings.
Fresh `pnpm check` passed 139 tests and the Manager proved the migration plus the main HTTP workflow
against local Wrangler/D1. Four material findings remain:

1. **P0 — remote migration is missing.** The Worker workflow deploys code without applying
   `worker/migrations` to the provisioned remote D1 first.
2. **P1 — rename cooldown is concurrency-bypassable.** It still performs a separate read and update;
   two simultaneous renames can both succeed.
3. **P1 — modal handoff restores focus to the old launcher.** Visibility is exclusive, but click and
   `U` ordering lets the dismissed dialog overwrite focus after the new dialog opens.
4. **P2 — CI Wrangler is unpinned.** The locally proven 4.127.1 is not the version invoked by the
   migration/deploy workflow.

The project permits one bounded repair and one fresh re-review, both now consumed. Stop the review
loop and escalate these exact findings plus the external Cloudflare provisioning gap to the user.
