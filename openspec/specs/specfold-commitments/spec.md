# specfold-commitments Specification

## Purpose
Defines `specfold commitments`, which lists, fulfills and withdraws deferred commitments in `knowledge/commitments/`.

## Requirements

### Requirement: Commitments command
The CLI SHALL provide `specfold commitments list [--state <state>]`, `specfold commitments fulfill <commitment> --change <name>` and `specfold commitments withdraw <commitment> --reason <text>`, each with `--json`. `<commitment>` SHALL be a path or file name of a concept in `knowledge/commitments/`. Every subcommand SHALL exit with 0 on success, 1 when the commitment is refused, and 2 on usage or environment errors.

#### Scenario: Missing reason
- **WHEN** `specfold commitments withdraw eu-data` runs without `--reason`
- **THEN** the command prints a usage error and exits with 2

### Requirement: List
`commitments list` SHALL print one line per commitment with its state, due date (the `trigger` when it is a date, else `-`), path, title and `trigger`, sorted by due date with dated ones first, showing only `open` commitments unless `--state` names another state or `all`.

#### Scenario: Due first
- **WHEN** one open commitment has `trigger: 2026-12-01` and another `trigger: before 1.0`
- **THEN** the dated commitment is listed first

### Requirement: Fulfill
`commitments fulfill` SHALL set `state: fulfilled` and `change: <name>` on an `open` commitment and refuse commitments in any other state. It SHALL run for agents and humans alike.

#### Scenario: Kept by a change
- **WHEN** `specfold commitments fulfill eu-data --change add-eu-region` runs on an open commitment
- **THEN** the commitment has `state: fulfilled` and `change: add-eu-region`

### Requirement: Withdraw
`commitments withdraw` SHALL refuse with an environment error, writing nothing, under the agent detection of `specfold verify`. For a human, it SHALL set `state: withdrawn` and `reason: <text>` on an `open` commitment and add a `verified` entry `{ by: human:<login>, at: <now with offset> }` with the login source of `specfold verify`, leaving `status` unchanged.

#### Scenario: Withdrawn by a human
- **WHEN** a human whose login is `ana` runs `specfold commitments withdraw eu-data --reason "market dropped"` at a terminal
- **THEN** the commitment has `state: withdrawn`, `reason: market dropped` and a `verified` entry by `human:ana`

#### Scenario: Withdrawn by an agent
- **WHEN** the same command runs with `CLAUDECODE=1`
- **THEN** the command exits with 2 and the commitment is unchanged
