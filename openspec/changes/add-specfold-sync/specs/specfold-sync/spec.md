# Spec Delta

## Purpose

Defines `specfold sync`, which applies the deterministic part of an archived change's knowledge delta: stubs, deprecation flags, capability and decision keys, indexes and the log entry.

## ADDED Requirements

### Requirement: Sync command
The CLI SHALL provide `specfold sync <change> [--dry-run] [--json]`, where `<change>` is a change name or an archived change id. A name SHALL resolve to the newest folder under `openspec/changes/archive/` named `<YYYY-MM-DD>-<change>`. The command SHALL exit with 0 when the delta is applied or nothing needed to change, 1 when the knowledge rules report an error, and 2 on usage or environment errors.

#### Scenario: Name resolves to the archived change
- **WHEN** `openspec/changes/archive/2026-10-26-add-guest-checkout/` exists and `specfold sync add-guest-checkout` runs
- **THEN** the command syncs that archived change and exits with 0

#### Scenario: Not archived yet
- **WHEN** `openspec/changes/add-guest-checkout/` exists but no archived folder for it
- **THEN** the command prints an environment error saying to archive the change first and exits with 2

### Requirement: Delta checked before writing
Before writing, the command SHALL check the archived change's `knowledge.md` with the knowledge rules K0-K6 of `specfold change check`, treating capabilities whose main spec now exists as covered by `create` or `update`. On any error it SHALL report the findings, write nothing and exit with 1.

#### Scenario: Broken delta writes nothing
- **WHEN** the archived change's delta has an op with `op: rename`
- **THEN** a `K2` error is reported, no file changes, and the command exits with 1

### Requirement: Create ops
For each `create` op whose file is missing, the command SHALL write a stub from the type's `specfold new` template with `status: draft`, the op's `summary` as `description`, a title derived from the file name and `generated` set to the current time with offset. An existing file SHALL keep its body.

#### Scenario: Missing concept gets a stub
- **WHEN** an op creates `decisions/guest-orders.md` of type `Decision` and the file does not exist
- **THEN** the file is created with `type: Decision`, `title: Guest orders`, the op's summary as description and `status: draft`

### Requirement: Stub actor
Stubs SHALL name `<actors.agent_prefix><SPECFOLD_MODEL>` as the `generated` actor when the environment variable `SPECFOLD_MODEL` is set, and `process:specfold-sync` otherwise. The command SHALL never write a `human:` actor.

#### Scenario: Actor without model variable
- **WHEN** `SPECFOLD_MODEL` is unset and a stub is written
- **THEN** its `generated.by` is `process:specfold-sync`

### Requirement: Deprecate ops
For each `deprecate` op, the command SHALL set `status: deprecated` in the named concept.

#### Scenario: Concept deprecated
- **WHEN** an op deprecates `decisions/old-checkout.md` with `status: stable`
- **THEN** the file afterwards has `status: deprecated` and an unchanged body

### Requirement: Capability keys
For each op with `type: Capability` and path `capabilities/<cap>.md`, the command SHALL set `spec` to `openspec/specs/<cap>/spec.md`, `resource` to the relative path from the card to that spec, `change` to the archived change id, and add a source with id `proposal` (and `design` when the archived change has `design.md`) pointing to the archived file, unless a source with that id exists.

#### Scenario: Card linked to the archived change
- **WHEN** `2026-10-26-add-guest-checkout` is synced and its delta creates `capabilities/guest-checkout.md`
- **THEN** the card has `spec: openspec/specs/guest-checkout/spec.md`, `resource: ../../openspec/specs/guest-checkout/spec.md`, `change: 2026-10-26-add-guest-checkout` and a `proposal` source pointing to `../../openspec/changes/archive/2026-10-26-add-guest-checkout/proposal.md`

### Requirement: Decision keys
For each `create` op with `type: Decision`, the command SHALL set `change` to the archived change id.

#### Scenario: Decision linked to its change
- **WHEN** an op creates `decisions/guest-orders.md`
- **THEN** the file has `change: 2026-10-26-add-guest-checkout`

### Requirement: Frontmatter preserved
When the command changes a concept's frontmatter, it SHALL keep all other keys, their order and comments, and the body byte for byte.

#### Scenario: Unrelated keys kept
- **WHEN** a card with `tags` and a custom key is synced
- **THEN** `tags`, the custom key and the body are unchanged

### Requirement: Indexes and log
After applying the ops, the command SHALL regenerate every `index.md` as `specfold index` does, and add the log entry `* **Change**: <archived-id>: created <n>, updated <n>, deprecated <n>` under today's date, unless a line in `log.md` already names the archived id.

#### Scenario: Log entry once
- **WHEN** a change is synced twice
- **THEN** `log.md` holds exactly one entry naming its archived id

### Requirement: Idempotent sync
A second run of the command on the same archived change SHALL change no file.

#### Scenario: Second run
- **WHEN** `specfold sync add-guest-checkout` runs twice in a row
- **THEN** the second run reports no changes and exits with 0

### Requirement: Dry run and output
With `--dry-run`, the command SHALL report the actions it would take and write nothing. Every action SHALL name the file and what changes. With `--json`, the command SHALL print one object `{"ok", "change", "dryRun", "actions": [{"path", "action"}], "findings"}`.

#### Scenario: Dry run writes nothing
- **WHEN** `specfold sync add-guest-checkout --dry-run --json` runs on an unsynced change
- **THEN** stdout lists the planned actions with `"dryRun": true` and no file changes
