## ADDED Requirements

### Requirement: Permissions at install
With the `claude` tool, `migrate install` SHALL run `specfold permissions sync` after merging `.claude/settings.json`, so the rules it owns follow the `permissions` setting in `specfold.yaml`. An invalid setting SHALL be reported with the sync's problems, leave `.claude/settings.json` as merged, and make install exit with 1 after installing the rest.

#### Scenario: Default permissions installed
- **WHEN** `migrate install` runs with the default tools in a repository whose `.claude/settings.json` holds only a `permissions.deny` list
- **THEN** afterwards `permissions.deny` still holds that list and `permissions.ask` holds the `push` and `open-pr` rules

#### Scenario: Agents only skips the rules
- **WHEN** install runs with `--tools agents`
- **THEN** no `.claude/` folder is created
