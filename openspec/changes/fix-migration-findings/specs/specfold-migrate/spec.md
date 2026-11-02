## MODIFIED Requirements

### Requirement: Migration state
The migrate commands SHALL record finished steps in `.specfold/migration/state.json` with the default branch and the base commit: `start`, `inventory` and `install` by themselves, and `plan`, `convert`, `seed` and `report` through `migrate mark <step>`. `migrate start` SHALL also write `.specfold/migration/.gitignore` ignoring `state.json`, so the state is never committed. `migrate status` SHALL print each step as done or open and the next open step.

#### Scenario: Resumed migration
- **WHEN** `start`, `inventory` and `mark plan` ran and `specfold migrate status` runs
- **THEN** it lists `start`, `inventory` and `plan` as done and names `install` as the next step

#### Scenario: State not committed
- **WHEN** `migrate start` ran and the user runs `git add .specfold/migration`
- **THEN** `.specfold/migration/.gitignore` is staged and `state.json` is not

### Requirement: Managed blocks
`migrate install` SHALL put Specfold's content for `AGENTS.md`, `CLAUDE.md`, `.github/pull_request_template.md`, `.gitignore`, `.github/CODEOWNERS`, `.gitattributes` and `.worktreeinclude` between `specfold:start` and `specfold:end` markers, creating a missing file, keeping all text outside the markers, and replacing only the block on a rerun. When the text of `CLAUDE.md` outside the markers already has a line `@AGENTS.md`, the block SHALL leave out its own `@AGENTS.md` line.

#### Scenario: Existing AGENTS.md
- **WHEN** `AGENTS.md` holds the team's own rules and install runs twice
- **THEN** `AGENTS.md` starts with one Specfold block and still holds the team's rules unchanged after it

#### Scenario: CLAUDE.md already imports AGENTS.md
- **WHEN** `CLAUDE.md` holds the line `@AGENTS.md` and the team's notes, and install runs
- **THEN** `CLAUDE.md` contains `@AGENTS.md` exactly once, outside the block, and the team's text is unchanged

### Requirement: Project files
`migrate install` SHALL create `specfold.yaml` from the template with `--source-glob` values (or the globs detected as `specfold init` detects them) and the knowledge skeleton only where they are missing, put `--stack` (or the detected stack) into the config context, and then run `specfold agents sync` and `specfold hooks install`.

#### Scenario: Source globs
- **WHEN** install runs with `--source-glob 'lib/**'` in a repository without `specfold.yaml`
- **THEN** `specfold.yaml` has `source_globs: ["lib/**"]` and `knowledge/index.md` exists

#### Scenario: Workspace globs
- **WHEN** install runs without `--source-glob` in a repository whose `package.json` has `workspaces: ["apps/*", "packages/*"]`
- **THEN** `specfold.yaml` has `source_globs: ["apps/*/src/**", "packages/*/src/**"]`
