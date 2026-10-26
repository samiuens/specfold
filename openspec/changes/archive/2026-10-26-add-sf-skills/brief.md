## Wish

Agents in any tool follow the Specfold workflow through short skills that call the CLI: look up knowledge, capture new knowledge, sync after archive, audit, and run the planning interview. In Claude Code a `planner` agent runs the interview in plan mode and ends with a plan the user approves.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M3 split? | agents sync, audit, skills with the planner, then agent instructions | user |
| Q2 | Does the M3 planner use subagents? | No; it does lookup and spec writing itself until the M8 roles exist | user |
| Q3 | How does the kit get the skills? | A byte-identical copy of the template's sf-* skills, checked in CI, linked by agents sync | user |
| Q4 | Which second tool proves the skills? | opencode | user |

## Out of scope

- The other roles (scout, spec-writer, plan-critic, implementer, verifier, knowledge-curator, integrator) and task packets (M8).
- `sf-migrate` (M6) and `sf-upgrade` (M9).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T15:35:30+01:00
