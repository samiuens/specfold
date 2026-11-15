# Spec Delta

## ADDED Requirements

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
