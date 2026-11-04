## MODIFIED Requirements

### Requirement: Command line and result
The CLI SHALL provide `specfold doctor [--json]`, which runs checks D1 to D8 in order. Each check SHALL report a status of `ok`, `warn` or `fail`, a message, and a fix hint unless the status is `ok`. The command SHALL exit with 1 when any check fails and with 0 otherwise.

#### Scenario: Only warnings
- **WHEN** every check is `ok` except D4, which is `warn`
- **THEN** the exit code is 0

#### Scenario: A failure
- **WHEN** D3 fails
- **THEN** the exit code is 1

### Requirement: Output
Without `--json`, the command SHALL print one line per check, `<id> <status> <message>`, then the fix hint indented on the next line for non-`ok` checks. With `--json`, it SHALL print `{"ok": <bool>, "checks": [{"id", "status", "message", "fix"}]}`, with `fix` as `null` for `ok` checks.

#### Scenario: JSON result
- **WHEN** a user runs `specfold doctor --json` and D4 warns
- **THEN** stdout parses as JSON with eight checks and `"ok": true`

## ADDED Requirements

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
