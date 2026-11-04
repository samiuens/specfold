# specfold-doctor Specification

## Purpose
Checks that a repository's environment and Specfold configuration are usable, and reports each problem with a fix before it surfaces as a confusing hook or CI failure.

## Requirements

### Requirement: Command line and result
The CLI SHALL provide `specfold doctor [--json]`, which runs checks D1 to D8 in order. Each check SHALL report a status of `ok`, `warn` or `fail`, a message, and a fix hint unless the status is `ok`. The command SHALL exit with 1 when any check fails and with 0 otherwise.

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
- **THEN** stdout parses as JSON with eight checks and `"ok": true`

### Requirement: D7 required gate
D7 SHALL read the repository's rules for the default branch through `gh` and be `warn` when no active rule requires the status check `specfold-gate`, with `node scripts/specfold.mjs gate require` as the fix. It SHALL be `ok` when such a rule exists, and `ok` with a note that the check was skipped when gh is missing, not logged in, the repository is not on github.com, or the rules cannot be read.

#### Scenario: Not required
- **WHEN** the default branch has no rule requiring `specfold-gate`
- **THEN** D7 is `warn` and its fix names `gate require`

#### Scenario: Offline
- **WHEN** `gh` is not on the PATH
- **THEN** D7 is `ok` with a note that the check was skipped

### Requirement: D8 agent permissions
D8 SHALL compare the `permissions` setting with the rules in `.claude/settings.json` as `specfold permissions sync --check` does. It SHALL be `fail` when the setting is invalid, naming the problem; `warn` when a rule would change, with `node scripts/specfold.mjs permissions sync` as the fix; `ok` otherwise, and `ok` with a note when no tool needs rendered rules.

#### Scenario: Rules out of date
- **WHEN** `specfold.yaml` sets `open-pr: allow` and the `open-pr` rules are in `permissions.ask`
- **THEN** D8 is `warn` and its fix names `permissions sync`

#### Scenario: Invalid setting
- **WHEN** `specfold.yaml` sets `push: deny` and `force-push: ask`
- **THEN** D8 is `fail` and its message names `force-push`

#### Scenario: Not a Claude Code repository
- **WHEN** `agents.targets` does not include `.claude/skills`
- **THEN** D8 is `ok` with a note that no tool needs rendered rules
