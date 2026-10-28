# specfold-release Specification

## Purpose
Defines the kit-only release script `tools/specfold/release.mjs`, which checks that the release version fields agree, packs the template tarball with its SHA-256, and prints a release's upgrade notes.

## Requirements

### Requirement: Release script
The kit SHALL provide `node tools/specfold/release.mjs check | pack <version> [--out <dir>] | notes <version> | index <dir>`. It SHALL exit with 0 on success, 1 when `check` finds a mismatch, and 2 on usage or environment errors.

#### Scenario: Unknown subcommand
- **WHEN** `release.mjs publish` runs
- **THEN** the script exits with 2 and names `check`, `pack`, `notes` and `index`

### Requirement: Version check
`check` SHALL compare the version in `tools/specfold/package.json`, `kit_version` in `template/specfold.yaml` and `kit_version` in `template/.specfold/manifest.json`, and report each field that differs from the package version.

#### Scenario: Template behind the package
- **WHEN** the package says `0.1.0-rc.1` and `template/specfold.yaml` says `0.0.0`
- **THEN** `check` exits with 1 and names `template/specfold.yaml`

### Requirement: Template tarball
`pack <version>` SHALL refuse unless `check` passes and the package version equals `<version>`. It SHALL write `specfold-template-v<version>.tar.gz`, holding the template's files and the kit's `upgrade/` folder below one top folder `specfold-template-v<version>/`, and `specfold-template-v<version>.tar.gz.sha256` in `sha256sum` format.

#### Scenario: Pack a release
- **WHEN** `pack 0.1.0-rc.1 --out dist` runs with all versions at `0.1.0-rc.1`
- **THEN** `dist/` holds the tarball with `specfold-template-v0.1.0-rc.1/scripts/specfold.mjs` and `.../upgrade/`, and a `.sha256` file whose hash matches it

#### Scenario: Version mismatch
- **WHEN** `pack 0.2.0` runs while the package version is `0.1.0-rc.1`
- **THEN** the script exits with 2 and writes nothing

### Requirement: Upgrade notes
`notes <version>` SHALL print a `## Upgrade notes` section with the content of `upgrade/notes/<version>.md`, or with the line `No manual steps.` when that file does not exist.

#### Scenario: Notes present
- **WHEN** `upgrade/notes/0.1.0-rc.2.md` exists and `notes 0.1.0-rc.2` runs
- **THEN** the output is `## Upgrade notes` followed by the file's content

#### Scenario: No notes
- **WHEN** `notes 0.1.0-rc.1` runs and no notes file exists
- **THEN** the output is `## Upgrade notes` followed by `No manual steps.`

### Requirement: Mirror index file
`index <dir>` SHALL write `<dir>/releases.json` listing every `specfold-template-v<version>.tar.gz` in that folder, newest version first, each entry with `version` and `notes`, the output of `notes <version>`.

#### Scenario: Index two releases
- **WHEN** a folder holds the tarballs of `0.1.0-rc.1` and `0.1.0-rc.2`, and `index` runs on it
- **THEN** `releases.json` lists `0.1.0-rc.2` first, then `0.1.0-rc.1`, each with its notes
