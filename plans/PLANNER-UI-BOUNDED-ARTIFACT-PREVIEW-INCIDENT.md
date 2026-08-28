# Planner UI bounded artifact preview incident

## Status

Confirmed UI projection defect. Canonical task artifacts remain intact.

## Symptom

On `/task/ABI-015`, expanded artifact panels look like complete documents but
show only an initial slice. This affects at least:

- `IMPLEMENTATION-GUIDE.md`: the canonical file contains 31 numbered steps,
  while the artifact panel stops around step 7;
- `ANALYSIS.md`: the artifact panel is also truncated.

The separate managed execution checklist still contains the complete v3 plan.
Do not shorten or rewrite the canonical 31-step guide to match the preview.

## Root cause

Planner's task page requests every artifact with a shared 3,000-character
preview limit. The UI only adds a subtle `bounded preview` label, so an expanded
panel is easily mistaken for the full document.

## Required fix

Render complete managed artifacts directly on the detail page for one selected
task. Its sections are already collapsible, so a second preview/full-document
navigation adds no value. Retain the existing safe per-file size limit as a
guard against abnormal files, but remove the 3,000-character presentation cut.

This must apply generically to every task artifact, including `ANALYSIS.md`,
`IMPLEMENTATION-GUIDE.md`, `REVIEW.md`, `QA.md`, and `VERIFICATION.md`.

## Regression proof

Create a task fixture whose analysis and implementation guide both exceed 3,000
characters. Verify that:

1. the task page renders both artifacts beyond 3,000 characters;
2. the implementation guide includes step 31;
3. the canonical managed checklist remains unchanged;
4. the existing abnormal-file size guard still applies.
