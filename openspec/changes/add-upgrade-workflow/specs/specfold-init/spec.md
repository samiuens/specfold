# Spec Delta

## MODIFIED Requirements

### Requirement: Init command
The CLI SHALL provide `specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--max-subagents <n>] [--upgrade-workflow] [--dry-run] [--json]`, run from the git root of a repository holding `specfold.yaml` and `openspec/config.yaml`. It SHALL ask nothing, exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a template repository
- **WHEN** `specfold init` runs in a git repository without `specfold.yaml`
- **THEN** the command exits with 2 and says to copy the template files or use sf-migrate

## ADDED Requirements

### Requirement: Upgrade workflow at init
With `--upgrade-workflow`, init SHALL copy `.specfold/workflows/specfold-upgrade.yml` to `.github/workflows/specfold-upgrade.yml`, record it in the manifest as a kit-owned file, and print how to add the `SPECFOLD_TOKEN` secret. Without the flag it SHALL not create that workflow.

#### Scenario: Workflow turned on
- **WHEN** `specfold init --upgrade-workflow` runs
- **THEN** `.github/workflows/specfold-upgrade.yml` exists, the manifest lists it, and the output names `SPECFOLD_TOKEN`

#### Scenario: Workflow off by default
- **WHEN** `specfold init` runs without the flag
- **THEN** `.github/workflows/specfold-upgrade.yml` does not exist
