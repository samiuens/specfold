# Spec Delta

## MODIFIED Requirements

### Requirement: D3 OpenSpec
D3 SHALL run `<repository root>/node_modules/.bin/openspec --version` when that file exists, else `openspec --version` from the PATH, and fail when neither is available or the version does not satisfy `requires.openspec` in `specfold.yaml` (space-separated comparators such as `>=1.15 <2`, defaulting to `>=1.15 <2`). The message SHALL say which binary was used.

#### Scenario: OpenSpec missing
- **WHEN** there is no `node_modules/.bin/openspec` and `openspec` is not on the PATH
- **THEN** D3 fails with a fix hint for installing OpenSpec

#### Scenario: Version out of range
- **WHEN** `openspec --version` prints `2.0.1` and `requires.openspec` is `>=1.15 <2`
- **THEN** D3 fails naming both versions

#### Scenario: Repository-local OpenSpec
- **WHEN** `openspec` is not on the PATH but `node_modules/.bin/openspec --version` prints `1.15.0`
- **THEN** D3 is `ok` and its message names the local binary
