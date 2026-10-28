# Proposal

## Why

A repository installed with `specfold init` or sf-migrate keeps the kit's version of that day. Kit fixes, new skills and stricter rules reach it only if someone copies files by hand, and that copy can't tell a kit file the team changed on purpose from one that is just old. The manifest already records the hash of every installed kit file and block, which is what an upgrader needs to tell the two apart.

## What Changes

- **`specfold upgrade [--check] [--to <version>] [--yes] [--pr] [--json]`:**
  - `--check` compares `kit_version` with the latest release on the repository's `channel` and prints the changelog excerpt, with no writes;
  - without `--check`, it downloads the target release, checks its SHA-256, and runs **the downloaded CLI's** upgrader on the repository;
  - with no `--yes` it prints the plan (add, replace, merge, remove, migrations); `--yes` applies it on branch `specfold/upgrade-<version>` and commits;
  - `--pr` pushes and opens the PR with `gh`.
- **Sources:** `source.github` (gh login, `GITHUB_TOKEN` or `SPECFOLD_TOKEN`), `source.url` and `source.path`. A token is never written to disk.
- **Per file class:**
  - an unchanged kit-owned file is replaced, or removed when the new release no longer has it;
  - a locally changed one is merged three ways with `git merge-file`, using the installed release's copy as the base, and a failed merge leaves conflict markers;
  - managed blocks are replaced inside their markers;
  - project-owned files are never touched.
- **Migrations** `upgrade/migrations/<version>.mjs` run in version order for every version after the installed one, up to the target.
- **Follow-ups and report:** the manifest and `kit_version` are updated. Then `openspec update`, `agents sync`, `hooks install`, `index`, `validate` and `gate --local` run, and everything lands in `.specfold/upgrade-report.md`.
- **Version skew:** write commands refuse when the manifest was written by a newer kit than the running CLI, and point to `specfold upgrade`.
- **Skill `sf-upgrade`:** runs the CLI, resolves conflicts with judgment, applies the release's upgrade notes, and stops before merging.
- **Sample app:** records `kit_version` and is upgraded from rc.1 to rc.2 with the released upgrader. The run is recorded.

## Capabilities

### New Capabilities
- `specfold-upgrade`: the upgrade command, sources, file classes, migrations, report and version skew.

### Modified Capabilities
- none

## Out of scope

- The weekly workflow, the init opt-in, the SessionStart reminder (`add-upgrade-workflow`).
- Rewriting project knowledge or specs: content migrations only report.

## Open points

1. **Stepping across majors:** the upgrader steps through the latest release of each major. With only 0.x releases there is nothing to step over yet, so the code is written but tested only with fixtures.
2. **A dirty tree:** `upgrade` without `--check` refuses on uncommitted changes, so the commit holds only the upgrade.
3. **Removed kit files** that were changed locally are kept and listed in the report.

## Impact

- New: `src/upgrade/` (sources, plan, apply, merge, migrations, report, command) and tests; `template/.agents/skills/sf-upgrade/` with its copies and links.
- Changed: `src/cli.ts` (the skew check for write commands), the template manifest, `examples/sample-app/`.
- Knowledge: an upgrade architecture concept, the capability card, the file-ownership decision.
