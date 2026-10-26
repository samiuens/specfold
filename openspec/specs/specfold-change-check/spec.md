# specfold-change-check Specification

## Purpose
Defines `specfold change check`, the deterministic check of an active change's `brief.md` and `knowledge.md`, which also reports the change's tasks check findings so hooks, the gate and `specfold sync` share one verdict.

## Requirements

### Requirement: Change check command
The CLI SHALL provide `specfold change check <change> [--json]`, which checks `openspec/changes/<change>/` against the brief rules B0-B4, the knowledge rules K0-K6 and the tasks rules, and SHALL exit with 0 when no finding is an error, 1 when one is, and 2 on usage or environment errors such as a missing argument or an unknown change.

#### Scenario: Clean change
- **WHEN** a change has a valid `brief.md`, `knowledge.md` and `tasks.md`
- **THEN** `specfold change check <change>` exits with 0

#### Scenario: Unknown change
- **WHEN** `specfold change check missing-change` runs and no active change has that name
- **THEN** the command prints an environment error and exits with 2

### Requirement: Change check output
Every finding SHALL carry a rule id, a severity, the file relative to the repository root, a line number when one applies, a message and a fix hint; tasks findings keep their group and task fields. With `--json`, the command SHALL print one object `{"ok", "change", "errors", "warnings", "findings"}`; without it, error lines and a summary line.

#### Scenario: JSON output
- **WHEN** `brief.md` has no `Confirmation` section and `--json` is set
- **THEN** stdout parses as JSON with `"ok": false` and a finding with `"rule": "B1"`, `"severity": "error"` and `"file"` ending in `brief.md`

### Requirement: Tasks check included
`specfold change check <change>` SHALL run the tasks check for the same change and include its findings, rule ids and exit-code effect in its own result.

#### Scenario: Tasks error fails change check
- **WHEN** a change's `knowledge.md` is valid but its `tasks.md` has a `T4` cycle
- **THEN** `specfold change check <change>` reports the `T4` error and exits with 1

### Requirement: Skip-specs changes
For a change whose `.openspec.yaml` sets `skip_specs: true`, the brief rules SHALL require only the `Wish` and `Confirmation` sections, and K5 SHALL not apply.

#### Scenario: Short brief for tooling
- **WHEN** a `skip_specs` change has a brief with only `Wish` and a filled-in `Confirmation`
- **THEN** no B1 finding is reported

### Requirement: B0 brief present
The command SHALL report an error with rule `B0` when the change has no `brief.md`.

#### Scenario: Missing brief
- **WHEN** the change folder has no `brief.md`
- **THEN** a `B0` error is reported

### Requirement: B1 brief sections
The command SHALL report an error with rule `B1` for every missing level-2 section among `Wish`, `Decisions`, `Out of scope`, `Open questions` and `Confirmation`, and when `Wish` is empty.

#### Scenario: Empty wish
- **WHEN** `## Wish` is followed directly by `## Decisions`
- **THEN** a `B1` error is reported for `Wish`

### Requirement: B2 confirmation
The command SHALL report an error with rule `B2` when `Confirmation` lacks a `confirmed_by:` value of the form `human:<login>` or a `confirmed_at:` value in ISO 8601 with a UTC offset.

#### Scenario: Agent confirmation
- **WHEN** `confirmed_by: claude-code/claude-opus-5-5`
- **THEN** a `B2` error is reported

#### Scenario: Timestamp without offset
- **WHEN** `confirmed_at: 2026-10-26T10:00:00`
- **THEN** a `B2` error is reported

### Requirement: B3 open questions owned
The command SHALL report an error with rule `B3` for every list item in `Open questions` that does not contain `(owner: <actor>)` followed by a non-empty reason. A section with no list items, or holding only `none`, SHALL pass.

#### Scenario: Unowned question
- **WHEN** `Open questions` contains `- Which retention period?`
- **THEN** a `B3` error is reported for that line

#### Scenario: Owned question
- **WHEN** `Open questions` contains `- Which retention period? (owner: human:samiuens) No requirement depends on it.`
- **THEN** no `B3` finding is reported for that line

### Requirement: B4 decisions sourced
The command SHALL report an error with rule `B4` for every row of the `Decisions` table with an empty `Question` or `Answer`, or a `Source` other than `user`, `delegated` or `knowledge:/<path>.md` naming an existing concept.

#### Scenario: Unknown knowledge source
- **WHEN** a row's source is `knowledge:/decisions/missing.md` and no such concept exists
- **THEN** a `B4` error is reported for that row

### Requirement: K0 knowledge present
The command SHALL report an error with rule `K0` when the change has no `knowledge.md`.

#### Scenario: Missing knowledge delta
- **WHEN** the change folder has no `knowledge.md`
- **THEN** a `K0` error is reported

### Requirement: K1 delta block
The command SHALL report an error with rule `K1` when `knowledge.md` has no `## Delta` section holding exactly one fenced `yaml` block, the block is not valid YAML, or `ops` is not a list.

#### Scenario: Broken YAML
- **WHEN** the delta block contains `ops: [`
- **THEN** a `K1` error is reported with the block's line

### Requirement: K2 op entries
The command SHALL report an error with rule `K2` for every op whose `op` is not `create`, `update` or `deprecate`, whose `path` is not a bundle-relative `.md` path without a leading `/` or `..` segment, whose `type` is not a configured type, or whose `summary` is missing, empty or longer than 160 characters.

#### Scenario: Unknown op
- **WHEN** an op has `op: rename`
- **THEN** a `K2` error is reported for that op

### Requirement: K3 empty delta reason
The command SHALL report an error with rule `K3` when `ops` is empty and `empty_reason` is missing or empty.

#### Scenario: Empty delta without reason
- **WHEN** `ops: []` and `empty_reason: ""`
- **THEN** a `K3` error is reported

### Requirement: K4 targets match the bundle
The command SHALL report an error with rule `K4` when an `update` or `deprecate` op names a file missing from the bundle, or when any op names an existing file whose `type` differs from the op's `type`.

#### Scenario: Update of a missing concept
- **WHEN** an op is `update` for `decisions/missing.md` and that file does not exist
- **THEN** a `K4` error is reported

#### Scenario: Concept written before archive
- **WHEN** an op is `create` for `capabilities/guest-checkout.md` and that file exists with `type: Capability`
- **THEN** no `K4` finding is reported

### Requirement: K5 capability coverage
The command SHALL report an error with rule `K5` for every capability `<cap>` with a delta spec under `specs/<cap>/spec.md` that has no op with `type: Capability` and `path: capabilities/<cap>.md`, using `op: create` when `openspec/specs/<cap>/spec.md` does not exist yet and `op: update` when it does.

#### Scenario: New capability without card
- **WHEN** the change adds `specs/guest-checkout/spec.md` and the delta has no op for `capabilities/guest-checkout.md`
- **THEN** a `K5` error is reported naming `guest-checkout`

### Requirement: K6 unique paths
The command SHALL report an error with rule `K6` when two ops name the same path.

#### Scenario: Duplicate path
- **WHEN** two ops both name `decisions/guest-orders.md`
- **THEN** a `K6` error is reported for the second op
