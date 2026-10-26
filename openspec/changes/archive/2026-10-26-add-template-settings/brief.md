## Wish

A repo created from `template/` works with Specfold out of the box: it has its own `specfold.yaml` and the code-comment convention. `examples/sample-app` proves the whole loop in a fresh repo: brief, proposal, specs, knowledge, tasks, apply, archive, sync.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | What is the sample app built with? | Plain Node with no dependencies, tests with `node:test` | user |
| Q2 | What is the sample domain? | A tiny to-do library with one change, `add-due-dates` | user |
| Q3 | How does the sample get the template? | A committed copy plus its own files; CI checks the kit-owned files against `template/` | user |
| Q4 | Who confirms the sample's brief? | The maintainer, in their own commit; the agent never fills it | user |
| Q5 | Which `actors.agent_prefix` does the template ship? | `claude-code/` | user |
| Q6 | What does the sample-app CI job run, given `tasks check` only works on active changes? | validate, `openspec validate --strict`, `node --test`, `sync --dry-run` expecting nothing to change, and the copy check | user |
| Q7 | How does the kit avoid scanning template knowledge as code? | Narrow the kit's `source_globs` from `template/**` to `template/*` and `template/openspec/**` | user |

## Out of scope

- `AGENTS.md` and `CLAUDE.md` in the template (M3).
- `specfold init` filling `source_globs` and the `Stack:` line (M3 or later).

## Open questions

none

## Confirmation

confirmed_by:
confirmed_at:
