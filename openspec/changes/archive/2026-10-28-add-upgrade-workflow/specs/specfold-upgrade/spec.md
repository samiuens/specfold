# Spec Delta

## ADDED Requirements

### Requirement: Opt-in workflow upgraded
When the manifest lists `.github/workflows/specfold-upgrade.yml`, the upgrader SHALL treat it as a kit-owned file whose new copy is the release's `.specfold/workflows/specfold-upgrade.yml`. Without that manifest entry it SHALL not create the file.

#### Scenario: Turned-on workflow replaced
- **WHEN** the manifest lists `.github/workflows/specfold-upgrade.yml`, the file is unchanged, and the new release changed `.specfold/workflows/specfold-upgrade.yml`
- **THEN** the upgrade replaces `.github/workflows/specfold-upgrade.yml` with that copy

#### Scenario: Not turned on
- **WHEN** the manifest does not list `.github/workflows/specfold-upgrade.yml`
- **THEN** the upgrade does not create it
