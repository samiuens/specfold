# specfold-agents-sync Specification

## Purpose
Defines `specfold agents sync`, which links every skill in `.agents/skills/` into the skill folders of the agent tools a repository lists, so skills have one source for all tools.

## Requirements

### Requirement: Agents sync command
The CLI SHALL provide `specfold agents sync [--check] [--json]`. It SHALL exit with 0 when the links are in place or were made so, 1 when `--check` finds anything to change, and 2 on usage or environment errors.

#### Scenario: Links created
- **WHEN** `.agents/skills/sf-lookup/` exists, `.claude/skills/` has no `sf-lookup`, and `specfold agents sync` runs
- **THEN** `.claude/skills/sf-lookup` is a symlink to `../../.agents/skills/sf-lookup` and the command exits with 0

### Requirement: Targets from settings
The command SHALL link into every folder listed in `agents.targets` in `specfold.yaml`, relative to the repository root, defaulting to `[".claude/skills"]`, and SHALL create a missing target folder.

#### Scenario: Two targets
- **WHEN** `agents.targets` is `[".claude/skills", ".opencode/skills"]` and one skill exists
- **THEN** both folders receive a link to that skill

### Requirement: Relative links
Every link SHALL be a symlink whose target is the relative path from the link's folder to `.agents/skills/<name>`.

#### Scenario: Nested target
- **WHEN** a target is `.config/tool/skills`
- **THEN** its link to `sf-lookup` points to `../../../.agents/skills/sf-lookup`

### Requirement: Own links maintained
A symlink in a target whose target resolves into `.agents/skills/` SHALL count as the command's own. The command SHALL repoint own links that point to the wrong skill path and remove own links whose skill no longer exists.

#### Scenario: Skill removed
- **WHEN** `.claude/skills/sf-old` links to `../../.agents/skills/sf-old` and that skill folder is gone
- **THEN** the link is removed and reported

### Requirement: Foreign entries kept
The command SHALL never change a real folder, a file or a foreign symlink in a target, and SHALL report each one that shares a name with a skill as kept.

#### Scenario: Generated folder kept
- **WHEN** `.claude/skills/openspec-propose/` is a real folder and `.agents/skills/openspec-propose/` exists
- **THEN** the folder is unchanged and reported as kept

### Requirement: Check mode
With `--check`, the command SHALL write nothing, report what it would change, and exit with 1 if anything would change.

#### Scenario: Missing link detected
- **WHEN** a skill has no link and `specfold agents sync --check` runs
- **THEN** nothing is written, the missing link is reported, and the command exits with 1

### Requirement: Output
Each change and each kept entry SHALL be reported with its repository-relative path and an action (`link`, `relink`, `unlink`, `kept`). With `--json`, the command SHALL print `{"ok", "check", "actions": [{"path", "action", "target"}]}`.

#### Scenario: JSON report
- **WHEN** one link is created and `--json` is set
- **THEN** stdout parses as JSON with an action `{"path": ".claude/skills/sf-lookup", "action": "link", "target": "../../.agents/skills/sf-lookup"}`

### Requirement: Nothing to link
Without a `.agents/skills/` folder, the command SHALL report that there are no skills to link and exit with 0.

#### Scenario: No skills folder
- **WHEN** the repository has no `.agents/skills/`
- **THEN** the command prints that there are no skills to link and exits with 0

### Requirement: Link failure
When a symlink cannot be created, the command SHALL stop with an environment error (exit 2) that names the path and says that symlinks must be allowed.

#### Scenario: Permission denied
- **WHEN** the file system refuses to create a symlink
- **THEN** the command exits with 2 and names the path it could not link
