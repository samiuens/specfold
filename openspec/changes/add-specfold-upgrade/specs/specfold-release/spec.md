# Spec Delta

## MODIFIED Requirements

### Requirement: Release script
The kit SHALL provide `node tools/specfold/release.mjs check | pack <version> [--out <dir>] | notes <version> | index <dir>`. It SHALL exit with 0 on success, 1 when `check` finds a mismatch, and 2 on usage or environment errors.

#### Scenario: Unknown subcommand
- **WHEN** `release.mjs publish` runs
- **THEN** the script exits with 2 and names `check`, `pack`, `notes` and `index`

## ADDED Requirements

### Requirement: Mirror index file
`index <dir>` SHALL write `<dir>/releases.json` listing every `specfold-template-v<version>.tar.gz` in that folder, newest version first, each entry with `version` and `notes`, the output of `notes <version>`.

#### Scenario: Index two releases
- **WHEN** a folder holds the tarballs of `0.1.0-rc.1` and `0.1.0-rc.2`, and `index` runs on it
- **THEN** `releases.json` lists `0.1.0-rc.2` first, then `0.1.0-rc.1`, each with its notes
