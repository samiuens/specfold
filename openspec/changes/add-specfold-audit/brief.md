## Wish

One command reports what is rotting in the knowledge bundle: stale or long-unverified concepts, links to deprecated concepts, concepts nothing points to, and specs without a capability card. The sf-audit skill and a scheduled CI job call it instead of re-checking by hand.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | When is `specfold audit` built? | In M3, as its own change, so sf-audit calls the CLI | user |
| Q2 | Which exit code on findings? | 1 on any finding | user |

## Out of scope

- The weekly CI issue and gate rule G12 (M4).
- Commitment and backlog checks (M5).

## Open questions

none

## Confirmation

confirmed_by:
confirmed_at:
