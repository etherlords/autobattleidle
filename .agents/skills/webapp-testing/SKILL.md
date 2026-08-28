---
name: autobattle-webapp-testing
description: Apply when verifying gameplay, UI, persistence, responsive behavior, or the deployed Pages build.
---

# Autobattle Web App Testing

Start from task acceptance criteria. Prefer deterministic unit tests for simulation and one bounded real
browser scenario for integrated behavior.

For every changed user action, record `initial state -> action/time -> resulting state`. Verify the
specific visible or persisted transition: for example click -> HP decreases, cooldown reaches zero ->
one automatic attack and reset, purchase -> currency/capability changes, reload -> state restores.
HTTP 200, shell/HUD presence, a screenshot, build success, and zero console errors are health checks;
they are not functional acceptance unless the task changes only that health property.

For release QA verify: first load, manual attack, auto-attack unlock/speed, every enemy grade, boss
transition, purchases and disabled reasons, localStorage reload, malformed-save recovery, keyboard and
pointer input, narrow and desktop layouts, long-running object/listener stability, and GitHub Pages.

Record exact URL, viewport, actions, expected observation, actual result, console errors, and artifacts.
Do not accept a screenshot or process exit as behavior proof by itself.
