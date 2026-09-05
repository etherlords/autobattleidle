# Agent Workflow

The root Codex task is the manager. It does not spawn a recursive manager.

## Flow

Sprint kickoff defines only task order, dependencies, and coarse acceptance. Detailed implementation
planning is deliberately just-in-time: repeat the preflight below before every task, because code,
Vault knowledge, and completed dependencies may have changed since the sprint was created.

1. `planner_get_current`, then `planner_next_task`.
2. Claim only a ready, unclaimed task through Planner; never bypass dependencies. The claim reserves
   the task for preparation; it does not authorize implementation yet.
3. Run a per-task preflight under that lease: read bounded execution context and BRIEF, query Vault,
   inspect current code/analogues, and re-check dependencies, scope, risks, acceptance, and knowledge.
4. Use `planner_task_update` for stale structured fields. Refresh manager-owned ANALYSIS and
   IMPLEMENTATION-GUIDE; because Planner V1.1 has no section-write tool, record this explicit narrow
   Markdown fallback in `planner_progress_append` after confirming `planner_doctor` needs no recovery.
   After a successful mutation, perform one exact bounded readback of the changed task. Do not call
   `planner_doctor` after every successful write: use it only for a failed/ambiguous operation, a
   structural readback mismatch, required fallback/recovery diagnosis, or once at the coherent batch
   boundary. A UI edit summary is not evidence of corruption. Report a Planner/Vault runtime defect
   only with the exact request/receipt, before/after evidence, and a reproducible mismatch.
5. Initialize or refine the step-by-step managed plan only through `planner_execution_plan_update`.
   Append a `preflight-ready` event. Do not delegate code until every step has an owner and proof.
6. Immediately before delegating implementation, call `planner_task_advance` to move `Ready` to
   `In Progress` with the exact live task revision and preflight/plan evidence, then read back canonical
   state. A preflight-ready event may exist while a task remains Ready; that is a warning, not permission
   to delegate.
7. Delegate bounded implementation to `autobattle_worker` only after that readback confirms `In Progress`.
8. Worker self-checks and records tool usage, direct file reads, elapsed time, and rework plus a short
   progress event. These are pilot cost proxies, not a claim of exact token savings.
9. Delegate independent review to `autobattle_reviewer`.
10. After review passes, delegate acceptance proof to `autobattle_qa`.
11. Manager maps evidence to acceptance, advances/closes through Planner, then commits code, plans, and
   Vault documentation together.

Before delegation, classify every acceptance criterion as `unit`, `integration`, or `deployed`. QA must
exercise the behavior at the highest layer the task claims to deliver. A domain-only task may close on
focused simulation evidence, but its verification and manager summary must explicitly say that the
feature is not yet wired into the application. For application/UI work, HTTP 200, a rendered shell,
clean console, screenshots, and successful deployment are supporting evidence only; they never prove
that combat, input, timers, persistence, upgrades, or progression work.

Every task preflight must also classify persistence impact as `no schema change`, `compatible extension`,
or `schema migration`. Even `no schema change` requires a supported historical-save load/reload regression.
A changed save shape or meaning must ship its version bump, one-version-at-a-time migration, source and
target fixtures, and deployed load -> migrate -> save -> reload proof in the same task. Valid supported
older saves must never silently reset; only an explicit user reset may intentionally discard valid progress.

On a failed gate, preserve the finding in its canonical Planner artifact, return the task to the same
implementation owner, and run one new independent gate after fixes. Escalate to the user rather than
cycling indefinitely.

## Model routing

- Terra medium: normal implementation.
- Terra high: independent review or bounded cross-layer diagnosis.
- Luna medium: QA, scripted checks, evidence, and summaries.
- Luna low: inventory and progress-log summarization.
- Sol: manager-only fallback for genuinely ambiguous architecture or repeated cross-layer failure.
## OMP agent discovery and fallback

Current OMP project agents use Markdown profiles in `.omp/agents/*.md`; `.codex/agents/*.toml`
is not an OMP discovery location. Keep the canonical role mapping:

| Planner role | OMP profile | OMP agent mapper | Default model route |
| --- | --- | --- | --- |
| implementation worker | `autobattle_worker` | `task` | `@task` → Luna |
| independent reviewer | `autobattle_reviewer` | `reviewer` | `@slow` → Luna |
| acceptance QA | `autobattle_qa` | `task` | `@task` → Luna |

The explicit mapper is `autobattle_worker → task`, `autobattle_reviewer → reviewer`, and
`autobattle_qa → task`; QA uses the full/browser-capable `task` agent rather than a read-only
reviewer. Every real delegation or fallback must preserve the receipt's actual actor, agent source,
profile name, and effective model.

Before the first real delegation after changing profiles or restarting OMP, start a new session from
the project root without `--resume` or `--continue`, then run a read-only handshake for each profile.
Verify the task receipt's `agentSource: project`, exact profile name, and `resolvedModel`; wrapper exit
status alone is insufficient when a handshake agent yields null metadata.

If project profiles are unavailable, use bundled `task` or `reviewer` only as an explicit fallback:
pass the corresponding worker, reviewer, or QA role instructions in the task prompt, record the
actual bundled actor and effective model in evidence, and do not claim that a project profile was used.
Do not advance Planner gates until the fallback ownership and evidence are recorded.

The current profiles intentionally route through Luna. The old TOML Terra settings are not implicitly
preserved; changing worker or reviewer routing to Terra requires a confirmed OMP alias/model receipt.

## Task event convention

Append short UTC events through Planner, not direct status edits:

`EVENT <claim|preflight-ready|checkpoint|review-pass|review-fail|qa-pass|qa-fail|returned|closed> — actor — summary`

Each worker final response also lists: Planner tools used, Vault tools used, expected tools not used and
why, direct files read, elapsed time, review/QA returns, commands/evidence, and blockers. These records
are the source for the final project timeline and the tool-assisted pilot report. Exact token savings
require a separate paired baseline run; never infer them from this single implementation.

## Checkpoint commits and Pages proof

- Never commit a knowingly broken state or every small editing step. An intermediate commit is allowed only after implementation self-check passes or after a distinct review/QA repair set has a fresh green check; tiny tasks need no intermediate checkpoint.
- After all required gates, the manager creates one task-closure checkpoint with the coherent code, plans, Vault docs, and evidence for that task only. Do not mix unrelated dirty state.
- Push every closed ABI task's coherent commits to `main`, then wait for GitHub Pages, verify the deployed public URL, and save the run/deployment receipt in task verification/reporting. A Pages failure blocks the checkpoint; do not rewrite history or begin the next task.
- Commit subjects use the repository module prefix such as `[ABI]` and omit internal task or file identifiers.
