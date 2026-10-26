## Wish

Nobody can claim a human's verification or confirmation they did not give. In CI, the gate compares every `human:<login>` the PR adds with the PR's author and approving reviewers on GitHub, and blocks on any other name.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Is G7 part of the gate change? | No; its own change, because it is the only rule that needs the GitHub API | user |
| Q2 | Which reviews count? | Each reviewer's latest review; only `APPROVED` counts | knowledge:/references/github-actions.md |

## Out of scope

- The workflow that passes the token and PR number (`add-gate-workflow`).
- `merge_group` runs, which have no review context and rely on the PR-time result.

## Open questions

none

## Confirmation

confirmed_by:
confirmed_at:
