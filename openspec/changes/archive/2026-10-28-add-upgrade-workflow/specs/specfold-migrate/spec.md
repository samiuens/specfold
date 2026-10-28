# Spec Delta

## ADDED Requirements

### Requirement: Upgrade workflow at install
`specfold migrate install` SHALL accept `--upgrade-workflow`. With it, install SHALL copy `.specfold/workflows/specfold-upgrade.yml` to `.github/workflows/specfold-upgrade.yml`, record it in the manifest as a kit-owned file, and print how to add the `SPECFOLD_TOKEN` secret. Without the flag it SHALL not create that workflow.

#### Scenario: Install with the workflow
- **WHEN** `specfold migrate install --from <template> --upgrade-workflow` runs on a repository without that workflow
- **THEN** `.github/workflows/specfold-upgrade.yml` exists, the manifest lists it, and the output names `SPECFOLD_TOKEN`
