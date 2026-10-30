# Spec Delta

## MODIFIED Requirements

### Requirement: Claude stop
`specfold hook claude-stop` SHALL run the local gate against the same base as the pre-push hook and, when a blocking rule fails, print the blocking findings to stderr and exit with 2, also when the event says a Stop hook is already active; otherwise, or when no base resolves, exit with 0. G15 findings for scenarios of changes not yet archived SHALL NOT block: they go to stderr marked as not blocking.

#### Scenario: Unfinished work
- **WHEN** Claude tries to stop while a touched change has an unconfirmed brief
- **THEN** the G13 finding goes to stderr and the command exits with 2

#### Scenario: Scenario without a test in an active change
- **WHEN** Claude tries to stop while an active change with a tasks.md has a scenario no test names, and nothing else blocks
- **THEN** the G15 finding goes to stderr marked "not blocking: the change is still in progress" and the command exits with 0

#### Scenario: Scenario without a test in an archived change
- **WHEN** Claude tries to stop while a change archived on the branch has a scenario no test names
- **THEN** the G15 finding goes to stderr and the command exits with 2
