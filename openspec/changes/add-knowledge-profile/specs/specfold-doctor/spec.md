# Spec Delta

## MODIFIED Requirements

### Requirement: D2 configuration
D2 SHALL fail when no `specfold.yaml` is found from the current directory upward, when it cannot be parsed, naming the parse error, or when its `profile` is neither `full` nor `knowledge`, naming the value.

#### Scenario: Broken configuration
- **WHEN** `specfold.yaml` contains invalid YAML
- **THEN** D2 fails with the parse error in its message

#### Scenario: Unknown profile
- **WHEN** `specfold.yaml` sets `profile: lite`
- **THEN** D2 fails naming `lite` and the allowed values

## ADDED Requirements

### Requirement: D3 in the knowledge profile
When `specfold.yaml` sets `profile: knowledge`, D3 SHALL be `ok` without running any `openspec` binary, and its message SHALL say that the knowledge profile does not use OpenSpec.

#### Scenario: Knowledge repository without OpenSpec
- **WHEN** doctor runs in a knowledge-profile repository where OpenSpec is not installed
- **THEN** D3 is `ok` and doctor does not exit with 1 because of it
