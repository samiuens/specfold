# specfold-verify Specification

## Purpose
Defines `specfold verify`, which lets a human mark concepts as verified under their own GitHub login and refuses to run for agents.

## Requirements

### Requirement: Verify command
The CLI SHALL provide `specfold verify <path>... [--json]`, which sets `status: stable` and records a `verified` entry `{ by: human:<login>, at: <now with offset> }` in every named concept. It SHALL exit with 0 when every concept was verified, 1 when any path was refused (writing nothing), and 2 on usage or environment errors.

#### Scenario: Concept verified
- **WHEN** a human runs `specfold verify decisions/retries.md` and their login is `ana`
- **THEN** the concept has `status: stable` and `verified: { by: human:ana, at: <now> }`, and the command exits with 0

### Requirement: Login source
The command SHALL take the login from `gh api user` when the GitHub CLI is logged in, and otherwise from `actors.github_login` in `.specfold/local.yaml`. When neither yields a login, it SHALL exit with an environment error explaining both options.

#### Scenario: No login available
- **WHEN** `gh` is not logged in and `.specfold/local.yaml` does not exist
- **THEN** the command exits with 2 and names both ways to provide a login

### Requirement: Agents refused
The command SHALL refuse with an environment error, writing nothing, when the environment variable `CLAUDECODE` or `SPECFOLD_MODEL` is set or stdin is not a terminal.

#### Scenario: Run by Claude Code
- **WHEN** `specfold verify decisions/retries.md` runs with `CLAUDECODE=1`
- **THEN** the command exits with 2, says that only humans verify, and the concept is unchanged

### Requirement: Paths checked first
The command SHALL accept bundle-relative and repository-relative paths, and SHALL refuse, before writing anything, a path that is not a concept in the bundle (including `index.md` and `log.md`) or names a deprecated concept.

#### Scenario: One bad path
- **WHEN** `specfold verify decisions/a.md index.md` runs
- **THEN** the command reports `index.md` as refused, writes nothing, and exits with 1

### Requirement: Repeated verification
When a concept already has `verified`, the command SHALL keep the other entries as a list and replace the entry of the same login.

#### Scenario: Second reviewer
- **WHEN** a concept verified by `human:ana` is verified by `ben`
- **THEN** `verified` lists both entries, `ana`'s unchanged
