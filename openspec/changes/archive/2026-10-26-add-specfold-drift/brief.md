## Wish

A concept that describes code which changed after the concept was last written or verified is flagged as possibly stale, in a report, in lookup results and on the PR that changed the code.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | From when do dependent file changes count? | The later of the concept's latest `verified[].at` (else `generated.at`) and the last commit that touched the concept file | user |
| Q2 | Which files does a concept depend on? | `resource` and `sources[].resource` that resolve to repository files, plus files whose `see knowledge:` comments name the concept | knowledge:/conventions/code-comments.md |
| Q3 | Does G16 block? | It warns; it blocks only with `gate.block_on_drift: true` (default false) | knowledge:/decisions/blocking-merge-gate.md |

## Out of scope

- Detecting drift from uncommitted work; drift is computed from git history only.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T17:41:27+01:00
