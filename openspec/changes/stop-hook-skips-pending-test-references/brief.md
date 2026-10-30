## Wish

Fix the Claude stop hook: it blocks on G15 ("scenario has no test reference") for every change that is planned or still being built, so a planning or apply session loops on the stop hook until the tests exist. In-progress changes should only warn; the PR gate keeps enforcing test references.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How does `hook claude-stop` treat G15? | G15 findings for scenarios of changes still under `openspec/changes/<name>/` (not archived) are printed as warnings and do not block; every other blocking finding still blocks, including G15 for archived changes and G15 "reference to unknown scenario". | user |
| Q2 | Do the PR gate and pre-push change? | No; `specfold gate`, the `specfold-gate` check and the pre-push hook keep G15 blocking. | user |
| Q3 | Where is it fixed? | In the Specfold kit (this repo), then released and taken into user repos with `sf-upgrade`; no local patches in user repos. | user |
| Q4 | What does the warning say? | The finding line followed by "not blocking: the change is still in progress". | delegated |

## Out of scope

- Blocking only once per unchanged state (remembering the previous stop's findings).
- A `specfold.yaml` setting for the stop hook.
- Changes to the pre-push hook, the PR gate or rule G15 itself.

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-30T13:51:24+01:00
