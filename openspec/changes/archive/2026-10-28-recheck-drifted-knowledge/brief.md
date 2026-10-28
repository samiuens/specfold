## Wish

The kit's knowledge has no drift flags left after M6: each of the 30 concepts that `specfold drift` flags is re-checked against the changes that flagged it, every real mismatch is fixed, and the ones that still hold are listed with a reason for the user to verify.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How are concepts cleared that still hold? | The agent re-checks each one against the plan diff and lists it with a one-line reason; the user reads the list and runs `specfold verify` on the ones they agree with | user |
| Q2 | Which marker names are right? | `specfold:start` / `specfold:end` as built; `decisions/naming-specfold.md` and the two lines of `docs/plan.md` are corrected, no code change | user |
| Q3 | What happens to the bootstrap pin runbook's source? | It drops `BOOTSTRAP.md` from `sources` and names the file in its steps, so a routine pin move no longer flags it | user |
| Q4 | What form does the work take? | An OpenSpec change with `skip_specs: true`, archived and synced like the others | user |

## Out of scope

- A drift ignore setting or any other CLI behavior change.
- Concepts that are not flagged by `specfold drift` today.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T08:23:37+01:00
