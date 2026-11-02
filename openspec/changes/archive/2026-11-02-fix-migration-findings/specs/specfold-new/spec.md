## MODIFIED Requirements

### Requirement: Type-specific keys
Every type SHALL also get `sources: []`. A `Decision` SHALL also get `decision: accepted`. A `Runbook` or `Interface` SHALL also get `stale_after` set to 90 days after the current time.

#### Scenario: Runbook review date
- **WHEN** a user creates a `Runbook`
- **THEN** its `stale_after` is 90 days after `generated.at`

#### Scenario: Sources stub for every type
- **WHEN** a user creates a `Component`
- **THEN** its frontmatter has `sources: []` and no `decision` or `stale_after`
