## Wish

M8's done-when is shown on a real run: a new sample-app change with three task groups that own disjoint files runs in parallel worktrees from this session, the branches merge cleanly, and one implementer returns a split proposal instead of widening its scope; the run is recorded like the M6 migration runs.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Who runs the proof? | The agent, from this session as orchestrator, with the new agent definitions and `isolation: worktree` | user |
| Q2 | Which change carries it? | A new sample-app change (such as `add-exports`) with three independent modules (CSV export, JSON import, summary counts), each with its own tests; one group's task also needs a one-line export from `src/todo.js`, outside its files, so its implementer must return a split proposal. The record says this was set up on purpose | user |

## Out of scope

- Pattern 1 (several changes at once) and pattern 3 (large mechanical changes) beyond their description in `sf-apply`.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T09:19:45+01:00
