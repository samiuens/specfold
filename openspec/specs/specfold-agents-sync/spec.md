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

### Requirement: omp roles generated
When `tools` lists `omp`, agents sync SHALL write `.omp/agents/<name>.md` for every `.claude/agents/<name>.md` except `planner.md`. The body SHALL be the source body after a first line naming the source file and that the file is generated. Without `omp`, it SHALL write no omp role.

#### Scenario: Roles written
- **WHEN** `tools` is `[agents, claude, omp]`, `.claude/agents/` holds `scout.md` and `planner.md`, and agents sync runs
- **THEN** `.omp/agents/scout.md` exists with the body of `.claude/agents/scout.md`, and `.omp/agents/planner.md` does not

#### Scenario: Not listed
- **WHEN** `tools` is `[agents, claude]` and agents sync runs
- **THEN** no `.omp/` folder is created

### Requirement: omp role frontmatter
A generated role SHALL keep `name` and `description`. It SHALL map `model` `haiku`, `sonnet` and `opus` to `@smol`, `@default` and `@slow`, `effort` to `thinking-level`, `skills` to `autoload-skills`, and `tools` to omp's tool names. A role whose `disallowedTools` names `Agent` SHALL get an empty `spawns`. Keys omp has no counterpart for SHALL be left out.

#### Scenario: Implementer mapped
- **WHEN** `.claude/agents/implementer.md` sets `model: sonnet`, `effort: medium`, `skills: [sf-lookup]`, `disallowedTools: Agent`, `isolation: worktree` and a `hooks` block
- **THEN** `.omp/agents/implementer.md` sets `model: "@default"`, `thinking-level: medium`, `autoload-skills: [sf-lookup]` and `spawns: ""`, and has no `isolation` or `hooks` key

#### Scenario: Read-only tools mapped
- **WHEN** `.claude/agents/verifier.md` sets `tools: Read, Grep, Glob, Bash`
- **THEN** `.omp/agents/verifier.md` sets `tools: [read, grep, glob, bash]`

### Requirement: Own role files maintained
A file in `.omp/agents/` SHALL count as the sync's own when its body starts with the generated line. The sync SHALL rewrite own files that differ from the generated text, remove own files whose source is gone or whose tool is no longer listed, and never change any other file, reporting each one that shares a name with a role as kept.

#### Scenario: Source removed
- **WHEN** `.omp/agents/old.md` starts with the generated line and `.claude/agents/old.md` is gone
- **THEN** the sync removes `.omp/agents/old.md` and reports it

#### Scenario: Hand-written role kept
- **WHEN** `.omp/agents/scout.md` was written by hand without the generated line
- **THEN** the sync leaves it unchanged and reports it as kept

### Requirement: omp task settings
When `tools` lists `omp`, agents sync SHALL set `task.maxRecursionDepth` to `1`, `task.isolation.enabled` to `true`, `task.isolation.merge` to `branch` and `task.isolation.apply` to `false` in `.omp/config.yml`, creating the file when missing and keeping every other key, comment and line. A file that is not a YAML mapping SHALL stop the sync with exit 2, unchanged.

#### Scenario: Team settings kept
- **WHEN** `.omp/config.yml` sets `modelRoles.smol` and agents sync runs with `omp` listed
- **THEN** the file still sets `modelRoles.smol` and also sets the four task keys

### Requirement: omp sync output
Agents sync SHALL report each written, rewritten, removed and kept role file and each changed omp setting, with the actions `write`, `rewrite`, `remove`, `kept` and `set`. `--check` SHALL cover them and exit with 1 when any would change. With `--json`, each SHALL be an entry of `actions`.

#### Scenario: Role out of date
- **WHEN** `.claude/agents/scout.md` changed since the last sync and `specfold agents sync --check --json` runs
- **THEN** nothing is written, `actions` holds `{"path": ".omp/agents/scout.md", "action": "rewrite"}`, and the command exits with 1
