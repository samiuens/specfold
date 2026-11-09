# Spec Delta

## ADDED Requirements

### Requirement: Profile file set at upgrade
The upgrader SHALL plan and apply only the kit-owned files and managed-block variants of the profile in `specfold.yaml`. It SHALL never write a file outside that profile's file set. A manifest without `profile` SHALL count as a full install. With `--yes`, it SHALL record the profile in the manifest.

#### Scenario: Knowledge upgrade
- **WHEN** a knowledge-profile repository upgrades to a release that changes `.agents/skills/sf-plan/SKILL.md` and `sf-lookup/SKILL.md`
- **THEN** the plan replaces `sf-lookup/SKILL.md` and lists nothing for `sf-plan`

#### Scenario: Old manifest
- **WHEN** a repository whose manifest has no `profile` and whose `specfold.yaml` has no `profile` upgrades
- **THEN** the plan is the same as before the `profile` setting existed

### Requirement: Switch to the full profile
When `specfold.yaml` sets `profile: full` and the manifest records `knowledge`, the upgrader SHALL plan the full file set and managed-block variants from the target release, which SHALL default to the installed version when no newer release exists. With `--yes`, it SHALL write the missing files, run `openspec init --tools <tools>` and then write the template's `openspec/config.yaml` when that file is missing.

#### Scenario: Switch at the installed version
- **WHEN** a knowledge-profile repository on the newest release sets `profile: full` and runs `specfold upgrade --yes`
- **THEN** `openspec/schemas/specfold/`, `.agents/skills/sf-plan/` and `openspec/config.yaml` exist, and the manifest records `profile: full`

### Requirement: No switch to the knowledge profile
When `specfold.yaml` sets `profile: knowledge` and the manifest records a full install, the upgrader SHALL exit with 2, writing nothing, and say that switching a full repository to the knowledge profile is not supported.

#### Scenario: Full repository refused
- **WHEN** a full repository sets `profile: knowledge` and runs `specfold upgrade --yes`
- **THEN** the command exits with 2 and no file changes
