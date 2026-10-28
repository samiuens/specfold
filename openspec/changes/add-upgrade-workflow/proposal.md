# Proposal

## Why

`specfold upgrade` only helps when someone remembers to run it. Teams that want upgrades to arrive like Dependabot updates need a workflow that opens the PR, and people working in Claude Code should hear about a waiting release where they already are, at session start. The kit itself must also notice when a change breaks upgrading from an earlier release, before a user does.

## What Changes

- **Weekly workflow** `specfold-upgrade.yml`:
  - it ships in the template as `.specfold/workflows/specfold-upgrade.yml`, so a plain template copy doesn't run it;
  - it runs `specfold upgrade --check --json` and, when a newer release exists, `specfold upgrade --yes --pr` with the `SPECFOLD_TOKEN` secret;
  - without the secret it ends green with a notice saying how to add one;
  - an existing open upgrade PR is updated rather than duplicated.
- **`specfold init --upgrade-workflow`** and **`specfold migrate install --upgrade-workflow`** copy it to `.github/workflows/`, record it in the manifest as kit-owned, and print the secret's setup. `BOOTSTRAP.md` and `sf-migrate` ask whether to turn it on, and upgrades keep the turned-on copy current.
- **The workflow's PRs:** commits are authored by `github-actions[bot]`, and a new upgrade PR closes older open ones.
- **Session-start reminder:**
  - `specfold hook claude-session-start` prints one line when a newer release is on the channel;
  - it checks at most once a day, gives up after 2 seconds, and caches the answer in the gitignored `.specfold/local-state.json`;
  - offline it prints nothing, and `upgrade.reminder: false` in `specfold.yaml` turns it off.
- **Kit CI, job `upgrade-fixtures`:**
  - it runs on PRs touching `template/`, `upgrade/` or `tools/specfold/`, and on release PRs;
  - it builds fixture repositories from the previous two releases' tarballs and upgrades them to the PR's packed build;
  - it checks that only kit-owned files and managed blocks changed, and that a locally changed kit file was merged three ways;
  - it becomes a required check at v0.1.0.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-init`: the `--upgrade-workflow` flag.
- `specfold-hooks`: the upgrade reminder at session start.
- `specfold-migrate`: the `--upgrade-workflow` flag of `install`.
- `specfold-upgrade`: the turned-on workflow file is upgraded from `.specfold/workflows/`.

## Out of scope

- Auto-merging upgrade PRs; the upgrade logic itself.

## Open points

1. **Fixture repositories:** made in CI by unpacking an old tarball and running its own `specfold init`. Then one kit file is edited and the repository is committed, so the job needs no stored fixtures.
2. **Release PRs and CI:** release-please's PRs run every check, because it uses a PAT. The job always reports and skips its work on PRs that don't touch the kit's payload.

## Impact

- New: `template/.specfold/workflows/specfold-upgrade.yml`, `src/upgrade/reminder.ts`, the `upgrade-fixtures` job in `.github/workflows/cli.yml` and its script.
- Changed: `src/init/`, `src/migrate/`, `src/upgrade/plan.ts` and `source.ts`, `src/repo.ts`, `src/hooks/claude.ts`, the template's `specfold.yaml` (`upgrade.reminder`) and `.gitignore`, `BOOTSTRAP.md`, `sf-migrate`, the template manifest.
- Knowledge: the upgrade flow, a runbook for turning the workflow on, and the init, migrate, hooks and upgrade cards.
