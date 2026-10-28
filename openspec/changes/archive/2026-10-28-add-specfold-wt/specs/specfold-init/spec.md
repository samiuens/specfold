# Spec Delta

## MODIFIED Requirements

### Requirement: Init command
The CLI SHALL provide `specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--max-subagents <n>] [--dry-run] [--json]`, run from the git root of a repository holding `specfold.yaml` and `openspec/config.yaml`. It SHALL ask nothing, exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a template repository
- **WHEN** `specfold init` runs in a git repository without `specfold.yaml`
- **THEN** the command exits with 2 and says to copy the template files or use sf-migrate

## ADDED Requirements

### Requirement: Subagent limit at init
Init SHALL set the subagent limit as `specfold parallel set` does: to `--max-subagents` when given, otherwise to 3 when `parallel show` finds no limit yet. An existing limit SHALL stay unless the flag is given.

#### Scenario: Default limit
- **WHEN** init runs without `--max-subagents` in a repository with no limit set
- **THEN** `.claude/settings.local.json` sets `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` to `"3"`

#### Scenario: Existing limit kept
- **WHEN** the limit is already 5 and init runs again without the flag
- **THEN** the limit stays 5
