## Wish

Agents read less without anyone hand-tuning a repo: `specfold graphify setup` sets up graphify code-only in one idempotent step, the template ships a permission deny list for files no agent should read, and the sample app documents the effect with numbers.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How does graphify get set up? | A CLI command `specfold graphify setup`: checks graphify is installed, installs its skill for `.agents/skills`, writes `.graphifyignore`, adds its PreToolUse guard to `.claude/settings.json`, runs the code-only first build; idempotent; a runbook explains it. Exact graphify commands are checked against its current release in the design | user |
| Q2 | What happens to `graphify-out/`? | Ignored whole by the template's `.gitignore` (managed block); every clone builds it locally and Specfold's hooks refresh it. The runbook names graphify's commit-with-code option (only `graph.json`, with its merge driver) for teams that want it; the plan's "commit GRAPH_REPORT.md" line is corrected, because graphify's team-workflows guide recommends ignoring that file | user |
| Q3 | How does the deny list ship? | `permissions.deny` Read rules in `template/.claude/settings.json` (lockfiles, `node_modules`, build output, coverage, snapshots, `graphify-out/graph.json`); migrate's settings merge adds missing rules to an existing file | user |
| Q4 | How is the M7 done-when proven? | `specfold stats` before and after on the sample app, plus one task run with and without graphify that the user runs in Claude Code, reading the session's token use; both recorded in the sample app's README | user |
| Q5 | Read barriers for other agents? | A backlog item, not built now | user |

## Out of scope

- Ignore or permission files of agents other than Claude Code (backlog).
- graphify's semantic pass and its LLM backends.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T08:38:56+01:00
