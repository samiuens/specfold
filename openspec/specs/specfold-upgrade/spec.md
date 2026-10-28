# specfold-upgrade Specification

## Purpose
Defines `specfold upgrade`, which takes a repository from its installed kit release to a newer one: checking the release sources, handing the work to the target release's CLI, merging kit files and blocks three ways, running migrations, and committing with a report on its own branch, plus the version-skew guard for older CLIs.

## Requirements

### Requirement: Upgrade command
The CLI SHALL provide `specfold upgrade [--check] [--to <version>] [--yes] [--pr] [--json]`, run inside a repository with `specfold.yaml`. It SHALL exit with 0 on success, 1 when `--check` finds a newer release or an applied upgrade left conflicts, and 2 on usage or environment errors.

#### Scenario: Pr without yes
- **WHEN** `specfold upgrade --pr` runs without `--yes`
- **THEN** the command exits with 2 and says `--pr` needs `--yes`

### Requirement: Upgrade check
`--check` SHALL compare `kit_version` with the newest release on the repository's `channel` (`stable`: final releases only; `next`: release candidates too), print both versions and the release notes, and write nothing.

#### Scenario: Newer release on next
- **WHEN** `kit_version` is `0.1.0-rc.1`, the channel is `next` and the source has `0.1.0-rc.2`
- **THEN** `--check` prints both versions and the notes of `0.1.0-rc.2`, and exits with 1

#### Scenario: Stable ignores candidates
- **WHEN** the channel is `stable` and the source has only `0.1.0-rc.2` after `kit_version`
- **THEN** `--check` reports no newer release and exits with 0

### Requirement: Release sources
The upgrader SHALL fetch releases from `source.github` through `gh` or a `GITHUB_TOKEN` or `SPECFOLD_TOKEN` token, from `source.url` with the release file names below that URL, or from `source.path`, a local folder. It SHALL never write a token to disk.

#### Scenario: Local folder
- **WHEN** `source.path` names a folder holding `specfold-template-v0.1.0-rc.2.tar.gz` and its `.sha256`
- **THEN** `specfold upgrade --to 0.1.0-rc.2` uses that tarball

### Requirement: Mirror index
For `source.url` the upgrader SHALL read the versions and their notes from `releases.json` below that URL. For `source.path` it SHALL read `releases.json` in that folder when present, and otherwise list its `specfold-template-v<version>.tar.gz` files.

#### Scenario: Url mirror
- **WHEN** `source.url` serves a `releases.json` listing `0.1.0-rc.2` with its notes, and `kit_version` is `0.1.0-rc.1` on channel `next`
- **THEN** `--check` prints `0.1.0-rc.2` and those notes, and exits with 1

### Requirement: Checksum
The upgrader SHALL check each downloaded tarball against its `.sha256` file and SHALL stop with exit 2, writing nothing, when they differ or the file is missing.

#### Scenario: Tampered tarball
- **WHEN** the tarball's hash differs from its `.sha256` file
- **THEN** the command exits with 2 and the repository is unchanged

### Requirement: New upgrader runs
After the checksum passes, the running CLI SHALL hand the upgrade to the `scripts/specfold.mjs` inside the target tarball, so the new version's upgrader plans and applies it.

#### Scenario: Handed to the new version
- **WHEN** a `0.1.0-rc.1` CLI upgrades to `0.1.0-rc.2`
- **THEN** the plan is computed by the `0.1.0-rc.2` CLI from the tarball

### Requirement: Upgrade plan
Without `--yes`, the upgrader SHALL print the plan, listing each file to add, replace, merge or remove, each block to replace and each migration to run, and write nothing. A dirty working tree SHALL stop `--yes` with exit 2.

#### Scenario: Dry run
- **WHEN** `specfold upgrade --to 0.1.0-rc.2` runs without `--yes`
- **THEN** the plan is printed and no file changes

### Requirement: Kit-owned files
With `--yes`, a kit-owned file whose hash equals its manifest hash SHALL be replaced with the new release's copy, or removed when the new release lacks it. A file missing locally SHALL be written. A locally changed file the new release removes SHALL be kept and reported.

#### Scenario: Unchanged file replaced
- **WHEN** `.agents/skills/sf-lookup/SKILL.md` matches its manifest hash and the new release changed it
- **THEN** it is replaced with the new copy

### Requirement: Three-way merge
A kit-owned file that differs from its manifest hash SHALL be merged three ways: the local file, the installed release's copy as the base, and the new copy. A conflict SHALL leave conflict markers and be reported. When the installed release can't be fetched, the file SHALL stay unchanged and be reported as a conflict.

#### Scenario: Local edit kept
- **WHEN** a team added a line to `.claude/agents/verifier.md` and the new release changed another part of it
- **THEN** the merged file holds both changes and no conflict is reported

#### Scenario: Conflicting edit
- **WHEN** the team and the new release changed the same line
- **THEN** the file holds conflict markers, the report lists it, and the command exits with 1

### Requirement: Managed blocks
The upgrader SHALL replace only the managed part of each block file and the kit keys of `openspec/config.yaml` and `.claude/settings.json`, keeping everything outside them.

#### Scenario: Text outside the block kept
- **WHEN** `AGENTS.md` has team text above the `specfold:start` marker
- **THEN** the upgrade replaces the block and keeps that text unchanged

### Requirement: Project content untouched
The upgrader SHALL never change files below `knowledge/`, `openspec/specs/` or `openspec/changes/`, values in `specfold.yaml` other than `kit_version`, or `.specfold/local.yaml`.

#### Scenario: Knowledge unchanged
- **WHEN** an upgrade runs on a repository with concepts in `knowledge/decisions/`
- **THEN** no file below `knowledge/` changes

### Requirement: Migrations
The upgrader SHALL run each `upgrade/migrations/<version>.mjs` from the tarball whose version is above the installed one and at most the target, in version order. A migration SHALL be safe to run twice.

#### Scenario: Two migrations in order
- **WHEN** the installed version is `0.1.0-rc.1`, the target is `0.1.0`, and migrations exist for `0.1.0-rc.2` and `0.1.0`
- **THEN** both run, `0.1.0-rc.2` first

### Requirement: Upgrade report and commit
With `--yes`, the upgrader SHALL update `.specfold/manifest.json` and `kit_version`, run the follow-up commands, write `.specfold/upgrade-report.md`, and commit everything on branch `specfold/upgrade-<version>`. With `--pr` it SHALL push that branch and open a PR with `gh`, using the report as its body.

#### Scenario: Applied upgrade
- **WHEN** `specfold upgrade --to 0.1.0-rc.2 --yes` runs without conflicts
- **THEN** branch `specfold/upgrade-0.1.0-rc.2` has one commit with the changed files, the manifest at `0.1.0-rc.2` and the report

### Requirement: Commit message
The upgrade commit SHALL use `upgrade.commit_message` from `specfold.yaml` with `{version}` replaced by the target version, and `chore: upgrade Specfold to v{version}` when the key is absent.

#### Scenario: Message from the settings
- **WHEN** `upgrade.commit_message` is `chore(template): 🔧 upgrade the sample app to v{version}` and the target is `0.1.0-rc.2`
- **THEN** the commit message is `chore(template): 🔧 upgrade the sample app to v0.1.0-rc.2`

### Requirement: Version skew
When `.specfold/manifest.json` records a newer `kit_version` than the running CLI, commands that write files SHALL refuse with exit 2 and name `specfold upgrade`, while read-only commands keep working.

#### Scenario: Old CLI refuses to write
- **WHEN** the manifest says `0.1.0-rc.2` and a `0.1.0-rc.1` CLI runs `specfold index`
- **THEN** the command exits with 2 and names `specfold upgrade`, and `specfold lookup` still works

### Requirement: Gate follow-up base
Among its follow-up commands, an applied upgrade SHALL run `specfold gate --base <commit> --local`, where `<commit>` is the commit branch `specfold/upgrade-<version>` was created from.

#### Scenario: Gate with the branch's start
- **WHEN** `specfold upgrade --yes` runs on a clean tree whose `HEAD` is commit `abc123`
- **THEN** the report lists `specfold gate --base abc123 --local` with its exit code

### Requirement: Config merges keep long lines
When the upgrade rewrites `openspec/config.yaml`, it SHALL keep every value on the lines it had, without folding long lines.

#### Scenario: Long rule kept on one line
- **WHEN** the upgrade adds a rules key to an `openspec/config.yaml` holding a 110-character rule
- **THEN** that rule is still on one line after the upgrade

### Requirement: Opt-in workflow upgraded
When the manifest lists `.github/workflows/specfold-upgrade.yml`, the upgrader SHALL treat it as a kit-owned file whose new copy is the release's `.specfold/workflows/specfold-upgrade.yml`. Without that manifest entry it SHALL not create the file.

#### Scenario: Turned-on workflow replaced
- **WHEN** the manifest lists `.github/workflows/specfold-upgrade.yml`, the file is unchanged, and the new release changed `.specfold/workflows/specfold-upgrade.yml`
- **THEN** the upgrade replaces `.github/workflows/specfold-upgrade.yml` with that copy

#### Scenario: Not turned on
- **WHEN** the manifest does not list `.github/workflows/specfold-upgrade.yml`
- **THEN** the upgrade does not create it
