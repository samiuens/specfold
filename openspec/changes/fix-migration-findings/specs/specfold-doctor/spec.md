## MODIFIED Requirements

### Requirement: D3 OpenSpec
D3 SHALL run `<repository root>/node_modules/.bin/openspec --version` when that file exists, else `openspec --version` from the PATH, and fail when neither is available or the version does not satisfy `requires.openspec` in `specfold.yaml` (space-separated comparators such as `>=1.15 <2`, defaulting to `>=1.15 <2`). Without a `specfold.yaml`, the current directory SHALL stand in for the repository root. The message SHALL say which binary was used.

#### Scenario: OpenSpec missing
- **WHEN** there is no `node_modules/.bin/openspec` and `openspec` is not on the PATH
- **THEN** D3 fails with a fix hint for installing OpenSpec

#### Scenario: Version out of range
- **WHEN** `openspec --version` prints `2.0.1` and `requires.openspec` is `>=1.15 <2`
- **THEN** D3 fails naming both versions

#### Scenario: Repository-local OpenSpec
- **WHEN** `openspec` is not on the PATH but `node_modules/.bin/openspec --version` prints `1.15.0`
- **THEN** D3 is `ok` and its message names the local binary

#### Scenario: Local OpenSpec before install
- **WHEN** doctor runs in a directory without `specfold.yaml`, `openspec` is not on the PATH, and `./node_modules/.bin/openspec --version` prints `1.15.0`
- **THEN** D3 is `ok` and its message names the local binary

### Requirement: D4 git hooks
D4 SHALL be `ok` when `git config core.hooksPath` is `.specfold/hooks`, or when an existing hook manager's config (`lefthook.yml`, `.husky/`, `.pre-commit-config.yaml`) contains `specfold hook` or `specfold.mjs hook`; otherwise, and outside a git repository, it SHALL be `warn`.

#### Scenario: Hooks not installed
- **WHEN** `core.hooksPath` is unset and no hook manager config mentions `specfold hook` or `specfold.mjs hook`
- **THEN** D4 is `warn` with the fix `specfold hooks install`

#### Scenario: Lefthook entries from install
- **WHEN** `core.hooksPath` is unset and `lefthook.yml` runs `node scripts/specfold.mjs hook pre-commit {0}`
- **THEN** D4 is `ok`
