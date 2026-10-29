## ADDED Requirements

### Requirement: Require command
The CLI SHALL provide `specfold gate require [--dry-run] [--json]`, which works through the `gh` CLI on the github.com repository of the current checkout. It SHALL exit with 0 when the ruleset of the requirement "Required gate ruleset" exists afterwards and with 2 when it can't be read or written. With `--dry-run` it SHALL report what it would do and write nothing.

#### Scenario: Created
- **WHEN** `specfold gate require` runs with an admin gh login on a repository without a `specfold-gate` ruleset
- **THEN** a ruleset `specfold-gate` requiring the check `specfold-gate` on the default branch exists, and the command exits with 0

#### Scenario: Dry run
- **WHEN** `specfold gate require --dry-run` runs on a repository without the ruleset
- **THEN** the output says the ruleset would be created, and no ruleset is written

### Requirement: Required gate ruleset
The ruleset SHALL be one repository ruleset named `specfold-gate` with enforcement `active`, targeting the default branch, with no bypass actors and one rule: the required status check `specfold-gate` from GitHub Actions, with "branches must be up to date" off. `gate require` SHALL create it when missing, update it when it differs, change nothing when it already matches, and leave every other ruleset untouched.

#### Scenario: Already in place
- **WHEN** the ruleset `specfold-gate` already matches and `specfold gate require` runs again
- **THEN** no ruleset is written, the output says the check is already required, and the command exits with 0

#### Scenario: Ruleset changed by hand
- **WHEN** someone added a bypass actor to the ruleset `specfold-gate` and `specfold gate require` runs
- **THEN** the ruleset is updated back to no bypass actors

#### Scenario: Other rulesets kept
- **WHEN** the repository has another ruleset on the default branch and `specfold gate require` runs
- **THEN** that ruleset is unchanged

### Requirement: Require command cannot set the check
When gh is missing or not logged in, the login lacks admin rights on the repository, or the repository cannot use rulesets, `specfold gate require` SHALL exit with 2 and print the reason and the manual steps: in the repository's settings, add a ruleset for the default branch that requires the status check `specfold-gate`.

#### Scenario: No admin rights
- **WHEN** GitHub refuses to create the ruleset because the login is not an admin of the repository
- **THEN** the command exits with 2 and prints the reason and the manual steps
