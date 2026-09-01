---
plannerFormat: 1
id: ABI-028
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-028 qa

## Verdict

PASS — independent QA v1 final deployed replay.

## Evidence

- Focused combat: 37/37 passed; persistence V1–V4: 18/18 passed; full `pnpm check`:
  20 files and 181/181 tests, lint, format, Worker TypeScript, and production build passed.
- Isolated desktop browser: Level 1 normal at 10/10; manual click reduced HP and emitted a visible
  manual-hit event; progression reached Level 2 veteran and Level 3 elite Critical Guard.
- Isolated historical V2 save loaded and migrated; automatic and manual progression both remained
  functional; reload restored the saved elite state in V4 localStorage.
- At 390×844 the elite identity and HP remained readable; browser console errors: zero.
- Local artifacts are under ignored `.playwright-cli/` and are not release authority.
- Deployed URL: `https://etherlords.github.io/autobattleidle/`.
- Exact published commit: `8c9bd65e3e377716542996654d77cd10d8a0deb1`.
- CI run `33451548829`: PASS. Pages run `33451548786`: PASS; `gh run view 33451548786 --repo etherlords/autobattleidle --json headSha,status,conclusion,workflowName` returned the exact commit SHA.
- Deployed static requests: document, JS, CSS, and favicon all HTTP 200; no failed requests.
- Asset identity: Pages artifact downloaded from the successful Pages run (`github-pages`, via `gh run download`) contained `assets/index-Mgw-pTlb.js`; SHA-256 `1D0A278D65D67EA2665367C9AF78BEC3D1951890CA2BE7C735A1F59456FC5ECA`, 660355 bytes. The served URL `https://etherlords.github.io/autobattleidle/assets/index-Mgw-pTlb.js` matched byte-for-byte (same SHA-256 and size), tying the live asset to the exact run/commit.
- Deployed Playwright session `abi028-final`, isolated query URL `https://etherlords.github.io/autobattleidle/?qa=abi028-final`: V2 fixture loaded as `Ember Brute · Level 1 · normal`, `84/140`, `Coins: 7`, proving V2 load/migration; one manual click plus automatic hit changed HP to `60/140` and showed both `Automatic hit: 12 damage` and `Manual hit: 12 damage`.
- Twenty real pointer clicks advanced the live app to `Ash Drake · Level 3 · elite · Manual Guard`, `42/120`; the intermediate snapshot showed `Ash Wisp · Level 2 · veteran`. The automatic source remained active throughout and rewards advanced (`Coins: 9`).
- At `390×844`, the elite heading and `30/120` HP remained readable. Reload at the same narrow viewport restored `Ash Drake · Level 3 · elite · Manual Guard`, `18/120`; V4 localStorage held the saved encounter/player state and the elapsed automatic tick was visible.
- Browser console: 0 errors. All captured deployed requests were HTTP 200. Snapshots: `.playwright-cli/page-2026-08-31T23-43-10-165Z.yml`, `.playwright-cli/page-2026-08-31T23-43-23-329Z.yml`, `.playwright-cli/page-2026-08-31T23-44-04-400Z.yml`.
- No source, dependency, Planner lifecycle, Git, or Vault mutations were made by QA. Front-matter `status: Blocked` is retained as Planner-controlled lifecycle state; this file records the independent QA verdict only.
