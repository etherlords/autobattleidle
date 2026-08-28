# ABI-008 deployed QA receipt

- Candidate SHA: `817e2d738fdbd4ba0cce3c59ada9debbce3091aa` (`HEAD == origin/main`).
- URL: `https://etherlords.github.io/autobattleidle/`.
- GitHub Actions: CI `33195361604` / job `98930994772` success; Pages `33195361621` / job `98930994787` success. Both were selected by the exact candidate commit.
- Desktop 1280x800: initial modal absent from the accessibility tree; real battlefield click changed 140/140 to 139/140 and added exactly one `Manual hit: 1 damage`.
- Modal: real Upgrades click exposed costs and disabled reasons; Close returned focus to `.upgrades-launcher`.
- Narrow 390x844: viewport and document scroll dimensions were both 390x844; hidden modal computed `display:none`; passive status/log/bars all computed `pointer-events:none`; console reported zero messages, errors, or warnings.
- Narrow input: one further pointer click plus Enter plus Space changed 139/140 to 136/140 and produced three additional one-damage log entries, proving each accepted activation exactly once.
- Public assets matched the local candidate build byte-for-byte: `index-COJvY0BA.js` SHA-256 `5b91ac9f46d8bbd0a9fde89488f22757db2c379bc3f8b37a9fcfe48fa2408bdc`; `index-dnh5GSTh.css` SHA-256 `aefbd10b56f44e0112bb463f6926002cccb5e2da7e4bde9879848da5a43eb6df`.
- Screenshots: `abi008-deployed-desktop-attack.png`, `abi008-deployed-desktop-modal.png`, `abi008-deployed-narrow.png`.

Verdict: PASS; no P0-P3 findings.
