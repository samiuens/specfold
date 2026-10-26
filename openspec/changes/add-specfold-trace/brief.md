## Wish

Every scenario in the specs is backed by at least one test that names it, and a test that names a scenario which no longer exists is caught, so specs and tests cannot drift apart unnoticed.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M5 split? | Five changes: trace, drift, backlog, commitment gate, interview retro | user |
| Q2 | Which files count as tests? | Files matching `trace.test_globs` in `specfold.yaml`, with defaults for common test layouts | user |
| Q3 | When does G15 block an uncovered scenario? | For changes with a `tasks.md` that the PR touches or archives; changes still being planned are skipped like G5 and G18; gaps elsewhere only warn | user |
| Q4 | How do tests name a scenario? | `spec: <capability-path>#<scenario-slug>` in any comment or test name; the slug rule is the one `specfold tasks check` already uses | knowledge:/decisions/task-breakdown.md |

## Out of scope

- The verifier agent that runs `specfold trace --change` (M8).
- Coverage of requirements without scenarios.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T17:41:27+01:00
