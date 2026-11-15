# Spec Delta

## MODIFIED Requirements

### Requirement: Agents refused
The command SHALL refuse with an environment error, writing nothing, when the environment variable `CLAUDECODE`, `OMPCODE`, `PI_SESSION_ID` or `SPECFOLD_MODEL` is set or stdin is not a terminal.

#### Scenario: Run by Claude Code
- **WHEN** `specfold verify decisions/retries.md` runs with `CLAUDECODE=1`
- **THEN** the command exits with 2, says that only humans verify, and the concept is unchanged

#### Scenario: Run by omp
- **WHEN** `specfold verify decisions/retries.md` runs with `PI_SESSION_ID` set and no other agent variable
- **THEN** the command exits with 2, says that only humans verify, and the concept is unchanged
