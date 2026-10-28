# Spec Delta

## ADDED Requirements

### Requirement: Local settings keep long lines
When `specfold parallel set` writes `.specfold/local.yaml`, it SHALL keep the file's other values on the lines they had, without folding long lines.

#### Scenario: Long value kept
- **WHEN** `.specfold/local.yaml` holds a 100-character string value and `parallel set 4` runs
- **THEN** that value is still on one line
