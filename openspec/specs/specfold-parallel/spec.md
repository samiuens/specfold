# specfold-parallel Specification

## Purpose
Defines `specfold parallel`, which keeps each person's limit on concurrently running subagents in files git ignores.

## Requirements

### Requirement: Parallel command
The CLI SHALL provide `specfold parallel set <n> | show [--json]`, run inside a repository with `specfold.yaml`. `set` SHALL accept only a positive whole number. The command SHALL exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a number
- **WHEN** `specfold parallel set many` runs
- **THEN** the command exits with 2 and changes no file

### Requirement: Personal limit
`parallel set <n>` SHALL write `n` to `env.CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` in `.claude/settings.local.json` and to `parallel.max_subagents` in `.specfold/local.yaml`, creating either file when missing and keeping every other key.

#### Scenario: Existing local settings
- **WHEN** `.claude/settings.local.json` holds a `permissions` block and `specfold parallel set 2` runs
- **THEN** the file keeps its `permissions` block and holds `"CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS": "2"` under `env`, and `.specfold/local.yaml` holds `max_subagents: 2` under `parallel`

### Requirement: Show the limit
`parallel show` SHALL print the effective limit and its source, in this order of precedence: the `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` environment variable, `.claude/settings.local.json`, `.specfold/local.yaml`; with none set, it SHALL say the tool's own default applies.

#### Scenario: From local settings
- **WHEN** only `.claude/settings.local.json` sets the limit to 2
- **THEN** `parallel show` prints 2 and names `.claude/settings.local.json`

### Requirement: Local settings keep long lines
When `specfold parallel set` writes `.specfold/local.yaml`, it SHALL keep the file's other values on the lines they had, without folding long lines.

#### Scenario: Long value kept
- **WHEN** `.specfold/local.yaml` holds a 100-character string value and `parallel set 4` runs
- **THEN** that value is still on one line
