# specfold-profile Specification

## Purpose
Defines the `profile` setting in `specfold.yaml`, which chooses between the full Specfold workflow and a knowledge-only setup, and the files and managed blocks each profile installs.

## Requirements

### Requirement: Profile setting
The `profile` key in `specfold.yaml` SHALL take the value `full` or `knowledge`; a missing key SHALL count as `full`. Any other value SHALL make every command that reads the settings exit with 2, naming the key, the value and the allowed values. `profile_version` SHALL keep its meaning as the format version and be independent of `profile`.

#### Scenario: Missing key
- **WHEN** `specfold.yaml` has no `profile` key
- **THEN** every command behaves as for `profile: full`

#### Scenario: Unknown value
- **WHEN** `specfold.yaml` sets `profile: lite` and `specfold validate` runs
- **THEN** the command exits with 2 and names `profile`, `lite`, `full` and `knowledge`

### Requirement: Knowledge profile file set
For the `knowledge` profile, the kit-owned files SHALL be those of `full` without `openspec/schemas/specfold/`, the skills `sf-plan`, `sf-apply` and `sf-sync` in `.agents/skills/`, and every `.claude/agents/` file except `scout.md`. No command SHALL create `openspec/` or run `openspec init` for the knowledge profile.

#### Scenario: Knowledge install
- **WHEN** a repository is installed with the knowledge profile and the `claude` tool
- **THEN** `.agents/skills/` holds sf-lookup, sf-capture, sf-audit, sf-upgrade, sf-migrate and sf-interview, `.claude/agents/` holds only `scout.md`, and there is no `openspec/` folder

#### Scenario: Full install unchanged
- **WHEN** a repository is installed with the full profile
- **THEN** the installed kit-owned files are the same as before the `profile` setting existed

### Requirement: Knowledge profile blocks
For the `knowledge` profile, the managed blocks of `AGENTS.md`, `CLAUDE.md` and `.github/pull_request_template.md` SHALL hold the template's knowledge variant. That variant SHALL not mention OpenSpec, specs or changes; the pull request template SHALL ask for a `No-knowledge reason:` line in place of `No-spec reason:`.

#### Scenario: Knowledge AGENTS.md
- **WHEN** a repository is installed with the knowledge profile
- **THEN** the managed block of `AGENTS.md` names no `openspec` command and tells agents to update the affected concepts with every code change

#### Scenario: Knowledge pull request template
- **WHEN** a repository is installed with the knowledge profile
- **THEN** `.github/pull_request_template.md` contains a `No-knowledge reason:` line and no `Change:` line

### Requirement: Knowledge profile settings
The template SHALL document `profile` in `specfold.yaml`. When a command installs the knowledge profile into a `specfold.yaml` that it creates, it SHALL set `gate.escape_label` to `no-knowledge`; an existing `gate.escape_label` SHALL be kept.

#### Scenario: Fresh knowledge settings
- **WHEN** `specfold migrate install --profile knowledge` creates `specfold.yaml`
- **THEN** the file sets `profile: knowledge` and `gate.escape_label: no-knowledge`
