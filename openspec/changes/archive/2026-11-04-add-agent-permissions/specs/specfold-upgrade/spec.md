## ADDED Requirements

### Requirement: Permissions after upgrade
Among its follow-up commands, an applied upgrade SHALL run `specfold permissions sync`. The merge of `.claude/settings.json` SHALL neither add nor remove a rule pattern that the sync owns.

#### Scenario: Team level kept
- **WHEN** `specfold.yaml` sets `push: allow`, the `push` rules are in `permissions.allow`, and `specfold upgrade --yes` runs
- **THEN** afterwards the `push` rules are still in `permissions.allow` and the report lists `specfold permissions sync` with its exit code
