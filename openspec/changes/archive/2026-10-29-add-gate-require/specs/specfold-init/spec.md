## MODIFIED Requirements

### Requirement: Init command
The CLI SHALL provide `specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--max-subagents <n>] [--upgrade-workflow] [--require-gate] [--dry-run] [--json]`, run from the git root of a repository holding `specfold.yaml` and `openspec/config.yaml`. It SHALL ask nothing, exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a template repository
- **WHEN** `specfold init` runs in a git repository without `specfold.yaml`
- **THEN** the command exits with 2 and says to copy the template files or use sf-migrate

## ADDED Requirements

### Requirement: Required gate at init
With `--require-gate`, init SHALL run the step of `specfold gate require` after its other steps. When the check cannot be set, init SHALL report the reason and the manual steps as a skipped step and still exit with 0. Without the flag, init SHALL change no GitHub setting. With `--dry-run`, init SHALL list the step without running it.

#### Scenario: Gate made required
- **WHEN** `specfold init --require-gate` runs with an admin gh login
- **THEN** the ruleset `specfold-gate` exists afterwards, and init exits with 0

#### Scenario: Cannot set it
- **WHEN** `specfold init --require-gate` runs without a gh login
- **THEN** init reports the step as skipped with the reason and the manual steps, and exits with 0
