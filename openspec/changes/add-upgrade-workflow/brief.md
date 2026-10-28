## Wish

Upgrades find the team instead of the other way round: an opt-in weekly workflow opens the upgrade PR like Dependabot, the Claude Code session start says once a day when a release is waiting, and the kit's CI upgrades fixture repositories built from earlier releases on every PR that could break that path.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How do teams opt in to the weekly workflow? | `specfold init --upgrade-workflow` (and a question in `BOOTSTRAP.md`) installs `specfold-upgrade.yml` and says to add the `SPECFOLD_TOKEN` secret; without it the workflow ends green with a notice | user |
| Q2 | Is there a session-start reminder? | Yes: SessionStart checks at most once a day with a 2-second timeout, caches the result in the gitignored `.specfold/local-state.json`, stays silent offline, and `specfold.yaml` can turn it off | user |
| Q3 | When do fixture upgrade tests run? | An `upgrade-fixtures` job on PRs that change `template/`, `upgrade/` or the CLI, and on release PRs; it upgrades fixtures built from the previous two releases to the PR's build and becomes a required check at v0.1.0 | user |

## Out of scope

- Upgrade logic itself (`add-specfold-upgrade`).
- Auto-merging upgrade PRs.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:53:11+01:00
