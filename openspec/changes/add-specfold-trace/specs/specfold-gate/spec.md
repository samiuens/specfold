## ADDED Requirements

### Requirement: G15 scenarios traced
For every change with a `tasks.md` that the diff touches or archives, the gate SHALL block with rule `G15` for each scenario of the change's `ADDED` and `MODIFIED` requirements that has no test reference (`specfold trace`). It SHALL block for every test reference that names no known scenario. When main-spec scenarios outside those changes have no test reference, it SHALL report one `G15` warning with their number.

#### Scenario: New scenario without test
- **WHEN** a touched change with `tasks.md` adds the scenario `Guest pays` and no test references it
- **THEN** a blocking `G15` finding names the scenario id and the change's spec file

#### Scenario: Change being planned
- **WHEN** a touched change has delta specs but no `tasks.md`
- **THEN** no `G15` finding is reported for its scenarios

#### Scenario: Renamed scenario
- **WHEN** the PR archives a change that renamed a scenario and a test still references the old id
- **THEN** a blocking `G15` finding names the test file and line

#### Scenario: Old gaps
- **WHEN** three main-spec scenarios the PR does not change have no test reference
- **THEN** one `G15` warning reports 3 uncovered scenarios and the gate can still pass
