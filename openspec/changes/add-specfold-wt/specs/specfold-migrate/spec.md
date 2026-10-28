# Spec Delta

## MODIFIED Requirements

### Requirement: Managed blocks
`migrate install` SHALL put Specfold's content for `AGENTS.md`, `CLAUDE.md`, `.github/pull_request_template.md`, `.gitignore`, `.github/CODEOWNERS`, `.gitattributes` and `.worktreeinclude` between `specfold:start` and `specfold:end` markers, creating a missing file, keeping all text outside the markers, and replacing only the block on a rerun.

#### Scenario: Existing AGENTS.md
- **WHEN** `AGENTS.md` holds the team's own rules and install runs twice
- **THEN** `AGENTS.md` starts with one Specfold block and still holds the team's rules unchanged after it

### Requirement: Claude settings merge
With the `claude` tool, `migrate install` SHALL add each Specfold hook from the template's `.claude/settings.json` whose command is not yet present, each `permissions.deny` rule of the template that is not yet present, each `env` entry whose name is not yet set and each other top-level key the repository's settings lack, keeping every other key, rule and value, and SHALL report a file that is not valid JSON without changing it.

#### Scenario: Existing permissions
- **WHEN** `.claude/settings.json` holds only a `permissions` block
- **THEN** after install it holds the same `permissions` block and Specfold's `SessionStart`, `PostToolUse` and `Stop` hooks

#### Scenario: Deny rules merged
- **WHEN** `.claude/settings.json` holds `permissions.deny: ["Read(./.env)"]`
- **THEN** after install `permissions.deny` starts with `Read(./.env)` followed by each of the template's deny rules once

#### Scenario: Worktree base kept
- **WHEN** `.claude/settings.json` sets `worktree.baseRef` to `"fresh"`
- **THEN** after install it still says `"fresh"`, and a repository without a `worktree` key gets the template's `"head"`
