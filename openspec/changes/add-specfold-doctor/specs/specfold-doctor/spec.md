# Spec Delta

## Purpose

Checks that a repository's environment and Specfold configuration are usable, and reports each problem with a fix before it surfaces as a confusing hook or CI failure.

## ADDED Requirements

### Requirement: Command line and result
The CLI SHALL provide `specfold doctor [--json]`, which runs checks D1 to D6 in order. Each check SHALL report a status of `ok`, `warn` or `fail`, a message, and a fix hint unless the status is `ok`. The command SHALL exit with 1 when any check fails and with 0 otherwise.

#### Scenario: Only warnings
- **WHEN** every check is `ok` except D4, which is `warn`
- **THEN** the exit code is 0

#### Scenario: A failure
- **WHEN** D3 fails
- **THEN** the exit code is 1

### Requirement: D1 Node version
D1 SHALL fail when the running Node.js version is lower than 20.19.

#### Scenario: Supported Node
- **WHEN** doctor runs on Node 22.3
- **THEN** D1 is `ok` and names the version

### Requirement: D2 configuration
D2 SHALL fail when no `specfold.yaml` is found from the current directory upward, or when it cannot be parsed, naming the parse error.

#### Scenario: Broken configuration
- **WHEN** `specfold.yaml` contains invalid YAML
- **THEN** D2 fails with the parse error in its message

### Requirement: D3 OpenSpec
D3 SHALL run `openspec --version` and fail when the command is not available or its version does not satisfy `requires.openspec` in `specfold.yaml` (space-separated comparators such as `>=1.15 <2`, defaulting to `>=1.15 <2`).

#### Scenario: OpenSpec missing
- **WHEN** `openspec` is not on the PATH
- **THEN** D3 fails with a fix hint for installing OpenSpec

#### Scenario: Version out of range
- **WHEN** `openspec --version` prints `2.0.1` and `requires.openspec` is `>=1.15 <2`
- **THEN** D3 fails naming both versions

### Requirement: D4 git hooks
D4 SHALL be `ok` when `git config core.hooksPath` is `.specfold/hooks`, or when an existing hook manager's config (`lefthook.yml`, `.husky/`, `.pre-commit-config.yaml`) contains `specfold hook`; otherwise, and outside a git repository, it SHALL be `warn`.

#### Scenario: Hooks not installed
- **WHEN** `core.hooksPath` is unset and no hook manager config mentions `specfold hook`
- **THEN** D4 is `warn` with the fix `specfold hooks install`

### Requirement: D5 knowledge bundle
D5 SHALL fail when `knowledge/` does not exist under the repository root, or when its root `index.md` is missing.

#### Scenario: Missing bundle
- **WHEN** the repository has `specfold.yaml` but no `knowledge/` folder
- **THEN** D5 fails

### Requirement: D6 graphify
D6 SHALL be `ok` in every case, reporting the version from `graphify --version` when graphify is installed, and that it is optional when it is not.

#### Scenario: graphify absent
- **WHEN** `graphify` is not on the PATH
- **THEN** D6 is `ok` with a message that graphify is optional

### Requirement: Output
Without `--json`, the command SHALL print one line per check, `<id> <status> <message>`, then the fix hint indented on the next line for non-`ok` checks. With `--json`, it SHALL print `{"ok": <bool>, "checks": [{"id", "status", "message", "fix"}]}`, with `fix` as `null` for `ok` checks.

#### Scenario: JSON result
- **WHEN** a user runs `specfold doctor --json` and D4 warns
- **THEN** stdout parses as JSON with six checks and `"ok": true`
