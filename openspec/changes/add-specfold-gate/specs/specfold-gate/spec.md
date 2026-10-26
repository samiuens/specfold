# Spec Delta

## Purpose

Defines `specfold gate`, the single merge verdict: it runs the merge-gate rules on what a branch changes against a base, blocks on failing blocking rules and reports the rest as warnings.

## ADDED Requirements

### Requirement: Gate command
The CLI SHALL provide `specfold gate --base <ref> [--local] [--label <name>]... [--pr-body <file>] [--json]`. It SHALL exit with 0 when no blocking rule fails, 1 when one does, and 2 on usage or environment errors such as a missing `--base` or a base git cannot resolve.

#### Scenario: Clean branch
- **WHEN** a branch changes a source file together with a valid active change, and nothing else is wrong
- **THEN** `specfold gate --base main` exits with 0

#### Scenario: Unknown base
- **WHEN** `specfold gate --base nope` runs and `nope` is not a git ref
- **THEN** the command prints an environment error and exits with 2

### Requirement: Diff under review
The gate SHALL judge the files changed between the merge base of `<ref>` and `HEAD` and `HEAD`. With `--local`, it SHALL also count uncommitted and untracked files.

#### Scenario: Uncommitted file counts locally
- **WHEN** a source file is modified but not committed and `specfold gate --base main --local` runs
- **THEN** the file counts as changed for every rule

### Requirement: Gate output
Every finding SHALL carry a rule id, an effect (`block` or `warn`), a repository-relative path when one applies, a line number when one applies, a message and a fix hint. With `--json`, the command SHALL print `{"ok", "base", "findings", "counts"}`; without it, blocking findings first, then warnings, then a summary line naming the blocking rules.

#### Scenario: JSON verdict
- **WHEN** G2 fails and `--json` is set
- **THEN** stdout parses as JSON with `"ok": false` and a finding with `"rule": "G2"` and `"effect": "block"`

### Requirement: G1 bundle conforms
The gate SHALL block with rule `G1` for every `specfold validate` error on the bundle other than the link rules L1 and L2.

#### Scenario: Missing frontmatter key
- **WHEN** a concept lacks `type`
- **THEN** a blocking `G1` finding names it

### Requirement: G2 indexes current
The gate SHALL block with rule `G2` for every `index.md` that `specfold index --check` reports as outdated.

#### Scenario: Stale index
- **WHEN** a new concept was added without regenerating its folder's `index.md`
- **THEN** a blocking `G2` finding names that `index.md`

### Requirement: G3 OpenSpec validates
The gate SHALL run `openspec validate --all --strict` and block with rule `G3` when it fails. When OpenSpec is not installed, it SHALL exit with an environment error, or report a `G3` warning with `--local`.

#### Scenario: Invalid delta spec
- **WHEN** a change's delta spec has a requirement without a scenario
- **THEN** a blocking `G3` finding is reported

### Requirement: G4 source changes need a change
When the diff touches a file matching `source_globs`, the gate SHALL block with rule `G4` unless the diff also changes a file in an active change folder, adds an archived change, or `--label no-spec` is given and the `--pr-body` file contains a non-empty `No-spec reason:` line. With `--local`, an unsatisfied G4 SHALL warn instead of block.

#### Scenario: Code without change
- **WHEN** a branch only changes `src/app.ts`, which matches `source_globs`
- **THEN** a blocking `G4` finding is reported

#### Scenario: Escape with reason
- **WHEN** the same branch is gated with `--label no-spec` and a PR body containing `No-spec reason: dependency bump`
- **THEN** no `G4` finding is reported

### Requirement: G5 knowledge delta valid
For every active change the diff touches, the gate SHALL block with rule `G5` for each knowledge-rule error (K0-K6) of `specfold change check`.

#### Scenario: Missing knowledge delta
- **WHEN** a touched change has no `knowledge.md`
- **THEN** a blocking `G5` finding names the change

### Requirement: G6 archived delta applied
For every change the diff archives, the gate SHALL block with rule `G6` when its knowledge rules fail or `specfold sync <change> --dry-run` reports anything left to change.

#### Scenario: Archived without sync
- **WHEN** a branch archives a change whose capability card lacks its `spec` key
- **THEN** a blocking `G6` finding names the change and the missing action

### Requirement: G8 no claimed human actor
The gate SHALL block with rule `G8` for every changed concept whose `generated.by` is a `human:` actor.

#### Scenario: Agent claims a human
- **WHEN** a changed concept has `generated: { by: human:ana, at: ... }`
- **THEN** a blocking `G8` finding names it

### Requirement: G9 touched concept not stale
The gate SHALL report rule `G9` for every changed concept whose `stale_after` has passed, blocking unless `gate.block_on_stale_touched` is false, then warning.

#### Scenario: Edited stale reference
- **WHEN** a branch edits a Reference with `stale_after: 2020-01-01T00:00:00Z`
- **THEN** a blocking `G9` finding names it

### Requirement: G10 links resolve
The gate SHALL report rule `G10` for every link error (L1, L2) of `specfold validate`, blocking unless `gate.block_on_broken_links` is false, then warning.

#### Scenario: Broken link
- **WHEN** a concept links to `/decisions/missing.md`
- **THEN** a blocking `G10` finding is reported

### Requirement: G12 bundle health
The gate SHALL warn with rule `G12` for every finding of audit rules A1 and A2 in the bundle.

#### Scenario: Old draft elsewhere
- **WHEN** an untouched concept has been unverified for longer than the audit limit
- **THEN** a `G12` warning is reported and the gate still exits with 0

### Requirement: G13 brief confirmed
For every active change the diff touches, the gate SHALL block with rule `G13` for each brief-rule error (B0-B4) of `specfold change check`.

#### Scenario: Unconfirmed brief
- **WHEN** a touched change's brief has an empty `confirmed_by`
- **THEN** a blocking `G13` finding is reported

### Requirement: G14 code references resolve
The gate SHALL block with rule `G14` for every `see knowledge:` reference in a changed file that names a missing concept, and warn for one naming a deprecated concept. Dangling references in unchanged files SHALL only warn.

#### Scenario: New dangling reference
- **WHEN** a changed source file contains `// see knowledge: /decisions/missing.md`
- **THEN** a blocking `G14` finding names the file and line

#### Scenario: Old dangling reference
- **WHEN** an unchanged file contains a reference to a missing concept
- **THEN** a `G14` warning is reported

### Requirement: G18 task breakdown
For every active change the diff touches, the gate SHALL run `specfold tasks check <change> --base <ref>`, block with rule `G18` for its errors and warn for its warnings.

#### Scenario: Overlapping parallel groups
- **WHEN** a touched change has two independent groups owning `src/**`
- **THEN** a blocking `G18` finding carries the `T5` message
