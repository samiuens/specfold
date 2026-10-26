## ADDED Requirements

### Requirement: P12 backlog item keys
In profile mode, the command SHALL report an error with rule `P12` for a `Backlog Item` whose `state` is not `open`, `promoted` or `dropped`, whose `priority` is not `low`, `medium` or `high`, whose `origin` is missing or empty, that is `promoted` without `change`, or that is `dropped` without `reason`.

#### Scenario: Promoted without change
- **WHEN** a `Backlog Item` has `state: promoted` and no `change`
- **THEN** a `P12` error is reported

#### Scenario: Unknown priority
- **WHEN** a `Backlog Item` has `priority: urgent`
- **THEN** a `P12` error is reported

### Requirement: P13 deferred commitment keys
In profile mode, the command SHALL report an error with rule `P13` for a `Deferred Commitment` whose `state` is not `open`, `fulfilled` or `withdrawn`, whose `trigger` is missing or empty, whose `committed_by` is present but not `human:<login>`, whose `vision` does not name an existing `Vision` concept, or that is `withdrawn` without `reason`. A `Deferred Commitment` without `committed_by` SHALL be a `P13` warning.

#### Scenario: Commitment claimed by an agent
- **WHEN** a `Deferred Commitment` has `committed_by: claude-code/opus`
- **THEN** a `P13` error is reported

#### Scenario: Agent draft of a commitment
- **WHEN** a `Deferred Commitment` has every required key but no `committed_by`
- **THEN** a `P13` warning is reported and the command exits with 0

### Requirement: P14 vision horizon
In profile mode, the command SHALL report an error with rule `P14` for a `Vision` whose `horizon` is present but not a string.

#### Scenario: Numeric horizon
- **WHEN** a `Vision` has `horizon: 2027` unquoted
- **THEN** a `P14` error is reported
