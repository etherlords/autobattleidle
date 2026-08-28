# ABI-009 deployed verification receipt

- Commit: `7c523e11f8a8c694df8feda7b2dd255d403a8c9f`
- Public URL: `https://etherlords.github.io/autobattleidle/`
- CI: run 33202118424, completed success.
- Pages: run 33202118481, completed success.
- Desktop Chromium 1440x900: first click changed HP 140 -> 139 and logged exactly one
  `Manual hit: 1 damage`; `scrollWidth=innerWidth=1440`.
- Narrow Chromium 390x844 after reload: persisted HP 139; first click changed HP 139 -> 138
  and logged exactly one `Manual hit: 1 damage`; `scrollWidth=innerWidth=390`.
- Console errors: 0. Console warnings: 0. Failed observed requests: 0.
- Deployed JS `index-BT6pxTxD.js` SHA-256:
  `E68AF67F3288F9D5570A75709B2DD2B4E885610E4B39F3F2A28C2D76795EF290`, identical to local `dist`.
- Deployed CSS `index-Cx9rXFzS.css` SHA-256:
  `A02439C74EE19294475E51C044C2B9E6416A860F2BD01D257E120AFBB3946E3D`, identical to local `dist`.
- Screenshots: `deployed-desktop-after-attack.png`, `deployed-narrow-after-attack.png`.

The full visual combination matrix remains the independently accepted source-factory browser evidence
under `output/playwright/abi009/`; public proof confirms the exact deployed factory bundle and live app.
