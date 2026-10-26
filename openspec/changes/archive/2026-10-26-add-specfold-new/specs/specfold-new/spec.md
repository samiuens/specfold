# Spec Delta

## Purpose

Creates a new knowledge concept from a per-type template, with the frontmatter the Specfold profile requires already filled in, so agents only write the body.

## ADDED Requirements

### Requirement: Command line
The CLI SHALL provide `specfold new <type> <path> [--title <text>] [--description <text>] [--by <actor>] [--json]`. `<path>` SHALL be bundle-relative (`decisions/x.md`) or bundle-absolute (`/decisions/x.md`) inside `knowledge/`. `<type>` SHALL be one of `types` in `specfold.yaml`. Otherwise the command SHALL exit with 2.

#### Scenario: Unknown type
- **WHEN** a user runs `specfold new Glossary domain/x.md` and `Glossary` is not in `types`
- **THEN** the command prints a usage error listing the allowed types and exits with 2

#### Scenario: Path not kebab-case
- **WHEN** a user runs `specfold new Decision decisions/UseYaml.md`
- **THEN** the command prints a usage error and exits with 2

### Requirement: File creation
The command SHALL create the file and any missing parent folders, print the repository-relative path, and exit with 0. If the file already exists it SHALL NOT change it and SHALL exit with 1.

#### Scenario: New concept in a new folder
- **WHEN** a user runs `specfold new Runbook runbooks/rotate-keys.md` and `knowledge/runbooks/` does not exist
- **THEN** `knowledge/runbooks/rotate-keys.md` is created and the command prints its path

#### Scenario: Existing file
- **WHEN** the target file already exists
- **THEN** the file is unchanged and the exit code is 1

### Requirement: Frontmatter
The created frontmatter SHALL contain `type`, `title` (from `--title`, else the file name with hyphens as spaces and the first letter uppercased), `description` (from `--description`, else empty), `status: draft` and `generated: { by: <actor>, at: <current time as ISO 8601 with offset> }`.

#### Scenario: Derived title
- **WHEN** a user runs `specfold new Decision decisions/guest-orders.md`
- **THEN** the frontmatter has `title: Guest orders`, `status: draft` and a `generated.at` with an explicit offset

### Requirement: Actor
`generated.by` SHALL be `--by` when given, else `<actors.agent_prefix><SPECFOLD_MODEL>` when the environment variable `SPECFOLD_MODEL` is set, else `process:specfold-new`. An actor starting with `human:` SHALL be refused with exit code 2.

#### Scenario: Model from the environment
- **WHEN** `SPECFOLD_MODEL=sonnet` is set and `actors.agent_prefix` is `claude-code/`
- **THEN** `generated.by` is `claude-code/sonnet`

#### Scenario: Human actor refused
- **WHEN** a user runs `specfold new Decision decisions/x.md --by human:ada`
- **THEN** no file is created and the exit code is 2

### Requirement: Type-specific keys
A `Decision` SHALL also get `decision: accepted` and `sources: []`. A `Runbook` or `Interface` SHALL also get `stale_after` set to 90 days after the current time.

#### Scenario: Runbook review date
- **WHEN** a user creates a `Runbook`
- **THEN** its `stale_after` is 90 days after `generated.at`

### Requirement: Templates
The body SHALL come from `.agents/skills/sf-capture/templates/<type-kebab>.md` when that file exists (for example `business-rule.md`), else from the built-in template for the type, else from a generic body with `# Summary` and `# Related`. In a template file, `{{type}}`, `{{title}}`, `{{description}}`, `{{by}}` and `{{now}}` SHALL be replaced.

#### Scenario: Override wins
- **WHEN** `.agents/skills/sf-capture/templates/decision.md` exists and a user creates a `Decision`
- **THEN** the new file is that template with its placeholders replaced

#### Scenario: Built-in body
- **WHEN** no override exists and a user creates a `Decision`
- **THEN** the body has the headings `# Decision`, `# Why`, `# Rejected alternatives` and `# Related`

### Requirement: JSON output
With `--json`, the command SHALL print `{"created": <repo-relative path>}` on success and `{"created": null, "error": <message>}` when the file exists.

#### Scenario: Created path in JSON
- **WHEN** a user runs `specfold new Term domain/ledger.md --json`
- **THEN** stdout parses as JSON with `"created": "knowledge/domain/ledger.md"`
