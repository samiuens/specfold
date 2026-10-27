# Spec Delta

## ADDED Requirements

### Requirement: Adoption PR
When the base commit has no `specfold.yaml`, the gate SHALL skip G4 and add a line to its output and summary naming the branch an adoption PR; every other rule SHALL run as usual.

#### Scenario: Migration PR
- **WHEN** the base has no `specfold.yaml` and the branch adds it together with a change to `src/app.ts`
- **THEN** no `G4` finding is reported and the output names the branch an adoption PR

#### Scenario: Later PR
- **WHEN** the base already has `specfold.yaml` and the branch only changes `src/app.ts`
- **THEN** G4 blocks as usual
