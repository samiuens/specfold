# Spec Delta

## MODIFIED Requirements

### Requirement: Claude settings merge
With the `claude` tool, `migrate install` SHALL add each Specfold hook from the template's `.claude/settings.json` whose command is not yet present, and each `permissions.deny` rule of the template that is not yet present, to the repository's settings, keeping every other key and rule, and SHALL report a file that is not valid JSON without changing it.

#### Scenario: Existing permissions
- **WHEN** `.claude/settings.json` holds only a `permissions` block
- **THEN** after install it holds the same `permissions` block and Specfold's `SessionStart`, `PostToolUse` and `Stop` hooks

#### Scenario: Deny rules merged
- **WHEN** `.claude/settings.json` holds `permissions.deny: ["Read(./.env)"]`
- **THEN** after install `permissions.deny` starts with `Read(./.env)` followed by each of the template's deny rules once
