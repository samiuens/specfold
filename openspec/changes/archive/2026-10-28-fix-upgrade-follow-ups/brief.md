## Wish

The two bugs the sample app's upgrade to `0.1.0-rc.2` found in the released upgrader are fixed: the `gate --local` follow-up gets a base, and no CLI command folds long YAML lines when it rewrites a file.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which base does the `gate --local` follow-up get? | The commit `specfold/upgrade-<version>` was created from | user |
| Q2 | How far does the line-wrapping fix go? | Every YAML rewrite keeps long lines: the upgrade's and migrate's OpenSpec config merges, `parallel set` and `hooks install`, through one shared helper | user |
| Q3 | Should the OpenSpec lookup try the git root for nested Specfold roots? | No; the upgrade report shows the failure | user |
| Q4 | How does the fix ship? | `release-as` becomes `0.1.0-rc.3`; the release PR waits for `add-upgrade-workflow`, so rc.3 holds both | user |

## Out of scope

- Finding OpenSpec from the git root.
- A new sample app upgrade; it comes with rc.3.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T18:31:53+01:00
