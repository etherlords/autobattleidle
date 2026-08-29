---
plannerFormat: 1
id: ABI-016
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-016 qa

## Verdict

PASS for local and deployed exact-SHA application-layer acceptance.

## Evidence

- URL: `http://127.0.0.1:5173/`; real headed Playwright browser; desktop and 390x844 viewports; console 0 errors and 0 warnings.
- Desktop boss: pointer drag changed the canvas screenshot hash while HP stayed 1,500/1,500 and no attack event appeared. Stationary activation changed 1,500 to 1,499 exactly once. Focused ArrowLeft/ArrowRight rotated without attack; Enter and Space each produced exactly one hit.
- Narrow boss: touch-style Pointer Events drag changed the screenshot hash with HP unchanged; stationary activation produced exactly one hit.
- Ordinary encounter: drag and arrows neither rotated nor attacked; stationary and keyboard activation retained manual attack behavior.
- HUD/modal: opening and dragging over the upgrades modal did not rotate or leak an attack.
- Resize/reload: 390-to-1280 resize retained the boss azimuth; reload reset presentation framing while a valid V2 save reloaded unchanged.
- Persistence: localStorage contained only `etherlords.autobattleidle.save.v2`; no camera property was serialized.
- Lifecycle/resources: focused listener/disposal tests passed; repeated disposal removes listeners/resources once. Focused browser-support suite passed 15/15.
- Artifacts: `output/playwright/abi016-boss-before.png`, `abi016-boss-after-drag.png`, `abi016-mobile-before.png`, `abi016-mobile-after-drag.png`, `abi016-ordinary-before.png`, `abi016-ordinary-after.png`, `abi016-modal-open.png`, `abi016-boss-resized.png`, and `abi016-boss-reload-reset.png`.
- Deployed candidate: `https://etherlords.github.io/autobattleidle/` at SHA `084afa2468fd1ecb341fd301310c12234f20aa1d`; CI run `33228656710` and Pages run `33228656702` succeeded for that exact SHA. Assets `index-opAdi5gC.js` and `index-CoUfL1zx.css` returned HTTP 200.
- Deployed real-browser smoke repeated desktop 1280x720 and narrow 390x844 boss/ordinary drag, stationary attack, arrows, Enter/Space, modal isolation, resize/reload, schema-v2-only storage, and clean console/network behavior. Real pointer flows passed; one invalid synthetic PointerEvent injection produced a native capture error and was discarded, then a clean reload and real interactions had zero console errors/warnings.
- Deployed artifacts: `output/playwright/abi016-deployed-boss-before.png`, `abi016-deployed-boss-drag.png`, `abi016-deployed-modal.png`, `abi016-deployed-ordinary-mobile.png`, `abi016-deployed-ordinary-mobile-actions.png`, `abi016-deployed-boss-rotated.png`, `abi016-deployed-boss-resized-390.png`, and `abi016-deployed-boss-touch-drag.png`.
