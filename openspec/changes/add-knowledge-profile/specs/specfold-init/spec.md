# Spec Delta

## MODIFIED Requirements

### Requirement: Init command
The CLI SHALL provide `specfold init [--profile <full|knowledge>] [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--max-subagents <n>] [--upgrade-workflow] [--require-gate] [--dry-run] [--json]`, run from the git root of a repository holding `specfold.yaml`, and for the full profile also `openspec/config.yaml`. It SHALL ask nothing, exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a template repository
- **WHEN** `specfold init` runs in a git repository without `specfold.yaml`
- **THEN** the command exits with 2 and says to copy the template files or use sf-migrate

#### Scenario: Knowledge repository without OpenSpec
- **WHEN** `specfold init` runs in a repository whose `specfold.yaml` sets `profile: knowledge` and that has no `openspec/` folder
- **THEN** the command does not exit with 2 for the missing `openspec/config.yaml`

### Requirement: Detected settings
Without flags, init SHALL detect the stack from package files at the root and the source globs from the workspace patterns (package.json `workspaces`, `pnpm-workspace.yaml`) as `<pattern>/src/**`, else from the code folders present (`src`, `lib`, `app`, `apps`, `packages`), fill the `Stack:` line of the `openspec/config.yaml` context when that file exists and `source_globs` in `specfold.yaml`, and print each value with where it came from. Flags SHALL override detection.

#### Scenario: TypeScript project
- **WHEN** the root holds `package.json`, `tsconfig.json` and `src/`, and init runs without flags
- **THEN** the context line reads `Stack: Node.js, TypeScript` and `source_globs` is `["src/**"]`

#### Scenario: Flag wins
- **WHEN** init runs with `--source-glob 'lib/**'` in the same repository
- **THEN** `source_globs` is `["lib/**"]`

#### Scenario: pnpm workspaces
- **WHEN** `pnpm-workspace.yaml` lists `apps/*` and `packages/*`, and init runs without flags
- **THEN** `source_globs` is `["apps/*/src/**", "packages/*/src/**"]`

#### Scenario: Knowledge profile stack
- **WHEN** init runs with `--profile knowledge` in a TypeScript project
- **THEN** the output names the detected stack and no `openspec/config.yaml` is written

### Requirement: Setup steps
After filling the settings, init SHALL, for the full profile, run `openspec init --tools <tools>` (default `agents,claude`) keeping the template's `openspec/config.yaml`; then, for every profile, `specfold agents sync`, `specfold permissions sync` and `specfold hooks install`, and write `.specfold/manifest.json` as `migrate install` does.

#### Scenario: Fresh template repository
- **WHEN** init runs in a new repository created from the template
- **THEN** `.agents/skills/openspec-propose/SKILL.md` exists, `config.yaml` still names `schema: specfold`, the git hooks are installed and the manifest exists

#### Scenario: Permissions rendered
- **WHEN** init runs in a new repository created from the template
- **THEN** `specfold permissions sync --check` exits with 0 afterwards and `.claude/settings.json` holds the `push` rules in `permissions.ask`

#### Scenario: Knowledge profile skips OpenSpec
- **WHEN** init runs with `--profile knowledge` and OpenSpec is not installed
- **THEN** init exits with 0, does not run `openspec init`, and the git hooks and manifest exist

## ADDED Requirements

### Requirement: Profile at init
`--profile` SHALL set `profile` in `specfold.yaml`; without it, init SHALL use the value already there. For the knowledge profile, init SHALL remove the template files outside the knowledge file set (`openspec/` and the kit-owned files the profile leaves out) when they equal the template's copies, keep and report any that differ, and set a `gate.escape_label` of `no-spec` to `no-knowledge`.

#### Scenario: Fresh template as knowledge repository
- **WHEN** init runs with `--profile knowledge` in a new repository created from the template
- **THEN** `specfold.yaml` sets `profile: knowledge` and `gate.escape_label: no-knowledge`, and `openspec/`, `.agents/skills/sf-plan/` and `.claude/agents/planner.md` are gone

#### Scenario: Changed template file kept
- **WHEN** init runs with `--profile knowledge` and `openspec/config.yaml` differs from the template's copy
- **THEN** `openspec/config.yaml` stays and the output reports it as kept

### Requirement: Profile switch at init
When `specfold.yaml` sets `profile: full` and the manifest records a full install, init with `--profile knowledge` SHALL exit with 2, writing nothing, and say that switching a full repository to the knowledge profile is not supported.

#### Scenario: Full repository refused
- **WHEN** init has run with the full profile and runs again with `--profile knowledge`
- **THEN** the command exits with 2 and no file changes
