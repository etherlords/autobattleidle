---
plannerFormat: 1
id: ABI-001
artifact: brief
project: ABI
profile: high-assurance
revision: 12
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-000
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-001: Establish architecture and playable application shell

## Goal

Establish architecture and playable application shell

## Work item

- Type: task
- Priority: high
- Status: Done

## Acceptance criteria

- [ ] The Vite application starts and owns one clear composition root


- [ ] The Vite application starts and owns one clear composition root
- [ ] Domain, Three.js, DOM UI, persistence, and app boundaries match the Vault architecture
- [ ] Resize and teardown paths do not leak listeners or render loops
- [ ] Focused tests and pnpm check pass
- [ ] PROGRESS records claim, checkpoint, tool usage, review, QA, and close events

## Dependencies

- ABI-000


- None

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881


- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
