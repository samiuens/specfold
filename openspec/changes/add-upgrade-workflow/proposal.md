# Proposal

## Why

`specfold upgrade` only helps when someone remembers to run it. Teams that want upgrades to arrive like Dependabot updates need a workflow that opens the PR, and people working in Claude Code should hear about a waiting release where they already are, at session start. The kit itself must also notice when a change breaks upgrading from an earlier release, before a user does.

## What Changes

- **Weekly workflow** `specfold-upgrade.yml`:
  - it ships in the template as `.specfold/workflows/specfold-upgrade.yml`, so a plain template copy doesn't run it;
  - it runs `specfold upgrade --check --json` and, when a newer release exists, `specfold upgrade --yes --pr` with the `SPECFOLD_TOKEN` secret;
  - without the secret it ends green with a notice saying how to add one;
  - an existing open upgrade PR is updated rather than duplicated.
- **`specfold init --upgrade-workflow`** copies it to `.github/workflows/`, records it in the manifest as kit-owned, and prints the secret's setup. `BOOTSTRAP.md` asks whether to turn it on.
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

## Out of scope

- Auto-merging upgrade PRs; the upgrade logic itself.

## Open points

1. **Fixture repositories:** made in CI by unpacking an old tarball and running its own `specfold init`. Then one kit file is edited and the repository is committed, so the job needs no stored fixtures.
2. **Release PRs and CI:** the job's trigger depends on how `add-release-automation` gets checks to run on release-please's PRs.

## Impact

- New: `template/.specfold/workflows/specfold-upgrade.yml`, `src/upgrade/reminder.ts`, the `upgrade-fixtures` job in `.github/workflows/cli.yml` and its script.
- Changed: `src/init/`, `src/hooks/claude.ts`, the template's `specfold.yaml` (`upgrade.reminder`) and `.gitignore`, `BOOTSTRAP.md`, the template manifest.
- Knowledge: the upgrade architecture, the init and hooks cards.
