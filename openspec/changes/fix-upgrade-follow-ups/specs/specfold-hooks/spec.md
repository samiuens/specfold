# Spec Delta

## ADDED Requirements

### Requirement: Hook manager files keep long lines
When `specfold hooks install` adds its entries to `lefthook.yml` or `.pre-commit-config.yaml`, it SHALL keep the file's other values on the lines they had, without folding long lines.

#### Scenario: Long lefthook command kept
- **WHEN** `lefthook.yml` has a 100-character `run` command and `hooks install` adds Specfold's entries
- **THEN** that command is still on one line
