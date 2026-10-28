# Proposal

## Why

The sample app's upgrade from rc.1 to rc.2, the first run of the released upgrader, finished without conflicts but showed two bugs:
- The `gate --local` follow-up exited with 2, because `gate` needs `--base` and the upgrader passed none, so the report's last check never ran.
- Merging `openspec/config.yaml` rewrapped every long list item at 80 characters. That's the `yaml` library's default line width, and the same call sits in migrate's config merge, `parallel set` and `hooks install`. Every such rewrite turns a small edit into a noisy diff in a file the team owns.

## What Changes

- **Gate follow-up:** `specfold upgrade --yes` runs `gate --base <commit> --local`, where the commit is the one the upgrade branch was created from.
- **YAML rewrites keep long lines:** one helper serializes YAML documents without folding. It's used by:
  - the upgrade's and migrate's OpenSpec config merges;
  - `parallel set` writing `.specfold/local.yaml`;
  - `hooks install` editing `lefthook.yml` and `.pre-commit-config.yaml`.
- **Release:** `release-as` becomes `0.1.0-rc.3`. The release PR stays open until `add-upgrade-workflow` is merged.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-upgrade`: the gate follow-up's base; config merges keep long lines.
- `specfold-migrate`: the OpenSpec config merge keeps long lines.
- `specfold-parallel`: `parallel set` keeps long lines in `.specfold/local.yaml`.
- `specfold-hooks`: hook-manager edits keep long lines.

## Out of scope

- Finding OpenSpec from the git root of a nested Specfold root.
- Upgrading the sample app again; that comes with rc.3.

## Impact

- Changed: `src/upgrade/command.ts`, `src/upgrade/config.ts`, `src/migrate/merge.ts`, `src/parallel/limit.ts`, `src/hooks/install.ts`, a new YAML helper, their tests, the bundle, `release-please-config.json`.
- Knowledge: the upgrade flow concept names the gate's base.
