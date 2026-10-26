## MODIFIED Requirements

### Requirement: Claude session start
`specfold hook claude-session-start` SHALL print the root `knowledge/index.md` section list and the names of the active changes, at most 40 lines, and exit with 0. When open deferred commitments are due within 30 days (their `trigger` is a date no later than 30 days from now, including overdue ones), it SHALL also print one line with their number and the hint `specfold commitments list`.

#### Scenario: Context at start
- **WHEN** a session starts in a repository with two active changes
- **THEN** stdout lists the knowledge sections and both change names within 40 lines

#### Scenario: Commitments due
- **WHEN** one open commitment has a `trigger` date ten days from now
- **THEN** stdout has one line saying 1 commitment is due within 30 days
