## Wish

A repository using Specfold upgrades with one command: `specfold upgrade --check` says whether a newer release exists, and `specfold upgrade` downloads it, runs the new version's upgrader, replaces unchanged kit-owned files, three-way merges locally changed ones, refreshes managed blocks, runs migrations, writes a report and commits on its own branch. Project content is never touched. Skill `sf-upgrade` drives it from an agent, and the sample app is upgraded from each release candidate to prove it.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Where does the base of a three-way merge come from? | The installed version's release tarball from the same source, checked against its SHA-256; when it can't be fetched, the file is reported as a conflict | user |
| Q2 | How far does `specfold upgrade` go? | It always commits on `specfold/upgrade-<version>`; `--pr` also pushes and opens the PR with `gh`; conflicts are committed with their markers and listed in the report | user |
| Q3 | Which release sources ship? | `github` (gh login, `GITHUB_TOKEN` or `SPECFOLD_TOKEN`), `url` (an HTTPS mirror with the same file names) and `path` (a local folder) | user |
| Q4 | Which repository proves the upgrader? | The sample app records a `kit_version` and is upgraded from each release candidate with the released upgrader; the kit repository is the template's source and is not upgraded | user |
| Q5 | Where do migrations live? | `upgrade/migrations/<version>.mjs` in the tarball, idempotent and chained, next to the notes | user |

## Out of scope

- The weekly workflow, the init opt-in and the SessionStart reminder (`add-upgrade-workflow`).
- Content migrations of project knowledge or specs beyond a report.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:53:11+01:00
