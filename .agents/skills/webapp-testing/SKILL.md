---
name: autobattle-webapp-testing
description: Apply when verifying gameplay, UI, persistence, responsive behavior, or the deployed Pages build.
---

# Autobattle Web App Testing

Start from task acceptance criteria. Prefer deterministic unit tests for simulation and one bounded real
browser scenario for integrated behavior.

For release QA verify: first load, manual attack, auto-attack unlock/speed, every enemy grade, boss
transition, purchases and disabled reasons, localStorage reload, malformed-save recovery, keyboard and
pointer input, narrow and desktop layouts, long-running object/listener stability, and GitHub Pages.

Record exact URL, viewport, actions, expected observation, actual result, console errors, and artifacts.
Do not accept a screenshot or process exit as behavior proof by itself.
