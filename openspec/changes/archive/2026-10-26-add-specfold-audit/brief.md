## Wish

One command reports what is rotting in the knowledge bundle: stale or long-unverified concepts, links to deprecated concepts, concepts nothing points to, and specs without a capability card. The sf-audit skill and a scheduled CI job call it instead of re-checking by hand.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | When is `specfold audit` built? | In M3, as its own change, so sf-audit calls the CLI | user |
| Q2 | Which exit code on findings? | 1 on any finding | user |
| Q3 | Are backlog items orphans? | No; `backlog/` is exempt like `vision/` | user |
| Q4 | Do mentions in AGENTS.md and CLAUDE.md count as incoming? | Yes; a bundle-absolute path named there counts | user |
| Q5 | What happens to the kit's own orphaned decisions? | They get links from related concepts in this change | user |

## Out of scope

- The weekly CI issue and gate rule G12 (M4).
- Commitment and backlog checks (M5).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T15:25:02+01:00
