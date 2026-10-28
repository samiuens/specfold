## Wish

Parallel work is safe and affordable: `specfold wt` gives every tool the worktree setup Claude Code has (plan, new, setup, clean), the template's settings make subagent worktrees start from the change's own commits, and `specfold parallel` lets each person set how many subagents may run at once.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M8 split? | Three changes, in this order: `add-specfold-wt` (worktree commands, settings, the subagent limit), `add-subagent-roles` (agent definitions, `sf-apply`, task packets), `add-pattern-2-run` (the proof on the sample app) | user |
| Q2 | How is the subagent limit set, given that `specfold init` asks nothing? | `specfold init --max-subagents <n>` (default 3) and `specfold parallel set <n>` write it to `.claude/settings.local.json` as `env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, plus `parallel.max_subagents` in `.specfold/local.yaml` for other tools; `sf-migrate` and the template README tell the agent to ask the user once and pass the number; `specfold parallel show` prints the value and its source | user |
| Q3 | Who prepares a fresh implementer worktree? | The implementer, as its first step: `specfold wt setup` installs dependencies with the shared cache and assigns `SPECFOLD_WT_INDEX`; no hook, since SessionStart does not fire for subagents | user |
| Q4 | Where do subagent worktrees start? | `worktree.baseRef: "head"` in the template's settings, because Claude Code's default branches from the remote default branch, which lacks the change's commits (checked 2026-10-28) | user |
| Q5 | What happens to cost per change? | A backlog item: it needs Claude Code's local transcripts | user |

## Out of scope

- The agent definitions and the orchestrator skill (`add-subagent-roles`).
- The proof run (`add-pattern-2-run`).
- Cost per change in `specfold stats` (backlog).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T09:19:45+01:00
