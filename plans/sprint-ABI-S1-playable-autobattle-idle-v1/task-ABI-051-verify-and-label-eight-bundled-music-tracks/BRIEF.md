---
plannerFormat: 1
id: ABI-051
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: In Progress
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-051: Verify and label eight bundled music tracks

## Goal

Verify and label eight bundled music tracks

## Work item

- Type: research
- Priority: normal
- Status: In Progress
- Parent: None

## Acceptance criteria

- [ ] All eight supplied MP3 files are present in the shipped public audio bundle and match the recorded manifest hashes.
- [ ] The manifest contains exactly eight music entries with valid duration, provenance, rights, and unique generation identifiers.
- [ ] Every track has a distinct user-facing title so the playlist status cannot collapse four Guardian variants into one label.
- [ ] The audit explains whether hearing only two or three tracks is an asset problem, playlist problem, or normal playback/index behavior.

## Dependencies

- None

## Related knowledge

- ABI-DOC-20260903-60F3BF
- ABI-DOC-20260903-FA2A0A

## Constraints

- Follow the resolved workflow contract and project instructions.
