## MODIFIED Requirements

### Requirement: Audit command
The CLI SHALL provide `specfold audit [--json]`, which checks the whole bundle and the main specs against rules A1-A8, and SHALL exit with 0 when there is no finding, 1 when there is any, and 2 on usage or environment errors.

#### Scenario: Clean bundle
- **WHEN** no concept breaks any audit rule
- **THEN** `specfold audit` prints a summary with 0 findings and exits with 0

## ADDED Requirements

### Requirement: A6 overdue commitment
The command SHALL report rule `A6` for every `Deferred Commitment` with `state: open` whose `trigger` parses as a date (`YYYY-MM-DD` or ISO 8601) before the current time.

#### Scenario: Promise past due
- **WHEN** an open commitment has `trigger: 2020-01-01`
- **THEN** an `A6` finding names it

#### Scenario: Condition trigger
- **WHEN** an open commitment has `trigger: before 1.0`
- **THEN** no `A6` finding is reported for it

### Requirement: A7 commitment without vision
The command SHALL report rule `A7` for every `Deferred Commitment` with `state: open` that has no `vision` key.

#### Scenario: Unanchored promise
- **WHEN** an open commitment has no `vision`
- **THEN** an `A7` finding names it

### Requirement: A8 neglected backlog item
The command SHALL report rule `A8` for every `Backlog Item` with `state: open` whose file was last changed by a commit more than `audit.backlog_untouched_days` days before the current time, defaulting to 180. Items without a commit SHALL NOT be reported.

#### Scenario: Old idea
- **WHEN** an open backlog item was last committed 200 days ago and the setting is absent
- **THEN** an `A8` finding names it
