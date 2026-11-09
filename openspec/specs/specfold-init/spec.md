# specfold-init Specification

## Purpose
Defines `specfold init`, which finishes setting up a repository that holds the template files: detected settings, OpenSpec skills, skill links, git hooks and the install manifest.

## Requirements

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

### Requirement: Dry run
With `--dry-run`, init SHALL print the values it would fill and the steps it would run, and change no file.

#### Scenario: Preview
- **WHEN** init runs with `--dry-run`
- **THEN** `git status` shows no changes and the output lists the detected stack and source globs

### Requirement: Idempotent init
A second `specfold init` SHALL keep values filled earlier unless a flag sets them again, and SHALL change no file when nothing differs.

#### Scenario: Rerun
- **WHEN** init has run once and runs again without flags
- **THEN** no file changes and the output says everything is up to date

### Requirement: Subagent limit at init
Init SHALL set the subagent limit as `specfold parallel set` does: to `--max-subagents` when given, otherwise to 3 when `parallel show` finds no limit yet. An existing limit SHALL stay unless the flag is given.

#### Scenario: Default limit
- **WHEN** init runs without `--max-subagents` in a repository with no limit set
- **THEN** `.claude/settings.local.json` sets `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` to `"3"`

#### Scenario: Existing limit kept
- **WHEN** the limit is already 5 and init runs again without the flag
- **THEN** the limit stays 5

### Requirement: Upgrade workflow at init
With `--upgrade-workflow`, init SHALL copy `.specfold/workflows/specfold-upgrade.yml` to `.github/workflows/specfold-upgrade.yml`, record it in the manifest as a kit-owned file, and print how to add the `SPECFOLD_TOKEN` secret. Without the flag it SHALL not create that workflow.

#### Scenario: Workflow turned on
- **WHEN** `specfold init --upgrade-workflow` runs
- **THEN** `.github/workflows/specfold-upgrade.yml` exists, the manifest lists it, and the output names `SPECFOLD_TOKEN`

#### Scenario: Workflow off by default
- **WHEN** `specfold init` runs without the flag
- **THEN** `.github/workflows/specfold-upgrade.yml` does not exist

### Requirement: Required gate at init
With `--require-gate`, init SHALL run the step of `specfold gate require` after its other steps. When the check cannot be set, init SHALL report the reason and the manual steps as a skipped step and still exit with 0. Without the flag, init SHALL change no GitHub setting. With `--dry-run`, init SHALL list the step without running it.

#### Scenario: Gate made required
- **WHEN** `specfold init --require-gate` runs with an admin gh login
- **THEN** the ruleset `specfold-gate` exists afterwards, and init exits with 0

#### Scenario: Cannot set it
- **WHEN** `specfold init --require-gate` runs without a gh login
- **THEN** init reports the step as skipped with the reason and the manual steps, and exits with 0

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
