# Spec Delta

## ADDED Requirements

### Requirement: OpenSpec rules in the knowledge profile
When `specfold.yaml` at the head sets `profile: knowledge`, the gate SHALL run neither `openspec validate` nor `specfold change check`, `tasks check` or `trace`, and SHALL report no `G3`, `G4`, `G5`, `G6`, `G13`, `G15` or `G18` finding and no design-section `G17` finding. Every other rule SHALL run as for the full profile.

#### Scenario: Knowledge repository without OpenSpec
- **WHEN** the gate runs in a knowledge-profile repository where OpenSpec is not installed
- **THEN** it does not exit with an environment error and reports no `G3` finding

#### Scenario: Knowledge rules still run
- **WHEN** a knowledge-profile branch adds a concept with a broken link
- **THEN** a `G10` finding is reported

### Requirement: G19 source changes need knowledge
In the knowledge profile, when the diff touches a file matching `source_globs`, the gate SHALL block with rule `G19` unless the diff also changes a file under the bundle root, or the label in `gate.escape_label` is given and the `--pr-body` file contains a non-empty `No-knowledge reason:` line. With `--local`, an unsatisfied G19 SHALL warn instead of block. G19 SHALL never run in the full profile.

#### Scenario: Code without knowledge
- **WHEN** a knowledge-profile branch only changes `ansible/site.yml`, which matches `source_globs`
- **THEN** a blocking `G19` finding is reported with a fix naming `knowledge/` and the escape label

#### Scenario: Code with a log entry
- **WHEN** the same branch also changes `knowledge/log.md`
- **THEN** no `G19` finding is reported

#### Scenario: Knowledge escape with reason
- **WHEN** the branch is gated with `--label no-knowledge`, `gate.escape_label` is `no-knowledge`, and the PR body contains `No-knowledge reason: dependency bump`
- **THEN** no `G19` finding is reported

#### Scenario: Full profile
- **WHEN** a full-profile branch only changes `src/app.ts`
- **THEN** `G4` blocks and no `G19` finding is reported

### Requirement: G19 adoption PR
When the base commit has no `specfold.yaml`, the gate SHALL skip G19 as it skips G4 and name the branch an adoption PR.

#### Scenario: Knowledge migration PR
- **WHEN** the base has no `specfold.yaml` and the branch adds it with `profile: knowledge` together with a change to `ansible/site.yml`
- **THEN** no `G19` finding is reported and the output names the branch an adoption PR
