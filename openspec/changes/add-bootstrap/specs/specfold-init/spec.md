# Spec Delta

## Purpose

Defines `specfold init`, which finishes setting up a repository that holds the template files: detected settings, OpenSpec skills, skill links, git hooks and the install manifest.

## ADDED Requirements

### Requirement: Init command
The CLI SHALL provide `specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--dry-run] [--json]`, run from the git root of a repository holding `specfold.yaml` and `openspec/config.yaml`. It SHALL ask nothing, exit with 0 on success and 2 on usage or environment errors.

#### Scenario: Not a template repository
- **WHEN** `specfold init` runs in a git repository without `specfold.yaml`
- **THEN** the command exits with 2 and says to copy the template files or use sf-migrate

### Requirement: Detected settings
Without flags, init SHALL detect the stack from package files at the root and the source globs from the code folders present, fill the `Stack:` line of the `openspec/config.yaml` context and `source_globs` in `specfold.yaml`, and print each value with where it came from. Flags SHALL override detection.

#### Scenario: TypeScript project
- **WHEN** the root holds `package.json`, `tsconfig.json` and `src/`, and init runs without flags
- **THEN** the context line reads `Stack: Node.js, TypeScript` and `source_globs` is `["src/**"]`

#### Scenario: Flag wins
- **WHEN** init runs with `--source-glob 'lib/**'` in the same repository
- **THEN** `source_globs` is `["lib/**"]`

### Requirement: Setup steps
After filling the settings, init SHALL run `openspec init --tools <tools>` (default `agents,claude`) keeping the template's `openspec/config.yaml`, then `specfold agents sync` and `specfold hooks install`, and write `.specfold/manifest.json` as `migrate install` does.

#### Scenario: Fresh template repository
- **WHEN** init runs in a new repository created from the template
- **THEN** `.agents/skills/openspec-propose/SKILL.md` exists, `config.yaml` still names `schema: specfold`, the git hooks are installed and the manifest exists

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
