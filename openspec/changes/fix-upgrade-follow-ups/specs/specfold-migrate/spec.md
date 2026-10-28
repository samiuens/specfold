# Spec Delta

## ADDED Requirements

### Requirement: OpenSpec config keeps long lines
When `specfold migrate install` merges an existing `openspec/config.yaml`, it SHALL keep every value on the lines it had, without folding long lines.

#### Scenario: Long context line kept
- **WHEN** install adds the specfold rules to a config whose context has a 120-character line
- **THEN** that line is unchanged after the merge
