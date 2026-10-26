## ADDED Requirements

### Requirement: G16 drift on changed files
For every changed file that is a dependent path of a concept (`specfold drift`) while the diff does not change that concept's file, the gate SHALL warn with rule `G16`, naming the file and the concept. With `gate.block_on_drift: true` in `specfold.yaml`, these findings SHALL block instead.

#### Scenario: Code changed, concept untouched
- **WHEN** a PR changes `src/retry.ts`, which `decisions/retries.md` depends on, and does not change that concept
- **THEN** a `G16` warning names `src/retry.ts` and `decisions/retries.md`

#### Scenario: Concept updated in the same PR
- **WHEN** the PR also changes `knowledge/decisions/retries.md`
- **THEN** no `G16` finding is reported for it

#### Scenario: Blocking configured
- **WHEN** `gate.block_on_drift` is `true` and a dependent file changes without its concept
- **THEN** the `G16` finding blocks
