## MODIFIED Requirements

### Requirement: Command line and result
The CLI SHALL provide `specfold doctor [--json]`, which runs checks D1 to D7 in order. Each check SHALL report a status of `ok`, `warn` or `fail`, a message, and a fix hint unless the status is `ok`. The command SHALL exit with 1 when any check fails and with 0 otherwise.

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
- **THEN** stdout parses as JSON with seven checks and `"ok": true`

## ADDED Requirements

### Requirement: D7 required gate
D7 SHALL read the repository's rules for the default branch through `gh` and be `warn` when no active rule requires the status check `specfold-gate`, with `node scripts/specfold.mjs gate require` as the fix. It SHALL be `ok` when such a rule exists, and `ok` with a note that the check was skipped when gh is missing, not logged in, the repository is not on github.com, or the rules cannot be read.

#### Scenario: Not required
- **WHEN** the default branch has no rule requiring `specfold-gate`
- **THEN** D7 is `warn` and its fix names `gate require`

#### Scenario: Offline
- **WHEN** `gh` is not on the PATH
- **THEN** D7 is `ok` with a note that the check was skipped
