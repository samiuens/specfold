# Spec Delta

## ADDED Requirements

### Requirement: Gate follow-up base
Among its follow-up commands, an applied upgrade SHALL run `specfold gate --base <commit> --local`, where `<commit>` is the commit branch `specfold/upgrade-<version>` was created from.

#### Scenario: Gate with the branch's start
- **WHEN** `specfold upgrade --yes` runs on a clean tree whose `HEAD` is commit `abc123`
- **THEN** the report lists `specfold gate --base abc123 --local` with its exit code

### Requirement: Config merges keep long lines
When the upgrade rewrites `openspec/config.yaml`, it SHALL keep every value on the lines it had, without folding long lines.

#### Scenario: Long rule kept on one line
- **WHEN** the upgrade adds a rules key to an `openspec/config.yaml` holding a 110-character rule
- **THEN** that rule is still on one line after the upgrade
