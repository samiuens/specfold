## Wish

Designs say how they treat the open commitments they touch, the gate warns when one is blocked or misnamed, nobody withdraws a commitment without a human signing it, and nobody claims another person's commitment.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is a contradiction detected deterministically? | design.md gets a `## Commitments` section listing each affected commitment as kept or blocked with a reason; G17 warns on blocked entries, on links to commitments that are not open, and on a missing section while open commitments exist | user |
| Q2 | How is `committed_by` protected? | G7 checks added `committed_by: human:<login>` like `verified` and `confirmed_by` | user |
| Q3 | What blocks? | A diff that sets a commitment to `withdrawn` without adding a human `verified` entry to it | knowledge:/vision/specfold.md |

## Out of scope

- The verifier agent's own judgment about contradictions (M8).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T17:41:27+01:00
