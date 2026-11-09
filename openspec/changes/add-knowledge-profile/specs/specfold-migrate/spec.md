# Spec Delta

## MODIFIED Requirements

### Requirement: Migrate command
The CLI SHALL provide `specfold migrate start [--default-branch <name>]`, `migrate inventory`, `migrate install --from <dir> [--profile <full|knowledge>] [--tools <list>] [--stack <text>] [--source-glob <glob>]... [--ref <ref>]`, `migrate mark <step>` and `migrate status`, each with `--json`, runnable from the git root without `specfold.yaml`. Each SHALL exit with 0 on success, 1 when refused, and 2 on usage or environment errors.

#### Scenario: No git repository
- **WHEN** `specfold migrate start` runs in a folder that is not a git working tree
- **THEN** the command exits with 2 and says a git repository is required

#### Scenario: Unknown profile
- **WHEN** `specfold migrate install --profile lite` runs
- **THEN** the command exits with 2, writing nothing, and names `full` and `knowledge`

### Requirement: Existing OpenSpec setup
For the full profile, when `openspec/config.yaml` exists, `migrate install` SHALL add the `specfold` schema, set `schema: specfold`, keep `context`, every existing rules key, specs and changes, and add a Specfold rules key only where it is missing. Without `openspec/`, it SHALL run `openspec init --tools <tools>` and then write the template's `config.yaml`. For the knowledge profile it SHALL neither create nor change anything under `openspec/` and SHALL not need OpenSpec installed.

#### Scenario: Active change on another schema
- **WHEN** the repository has `openspec/changes/add-login/` on the `spec-driven` schema
- **THEN** after install `config.yaml` names `schema: specfold`, its old `context` is kept, and `add-login/.openspec.yaml` is unchanged

#### Scenario: Knowledge profile without OpenSpec
- **WHEN** `migrate install --profile knowledge` runs in a repository without `openspec/` and OpenSpec is not installed
- **THEN** the install succeeds and no `openspec/` folder exists afterwards

### Requirement: Install manifest
`migrate install` SHALL write `.specfold/manifest.json` with `manifest_version: 1`, the template's `kit_version`, the installed `profile`, the `--ref` value when given, and a SHA-256 hash for every kit-owned file and managed block it installed.

#### Scenario: Manifest entry
- **WHEN** install writes `scripts/specfold.mjs`
- **THEN** the manifest lists `scripts/specfold.mjs` with the SHA-256 of its content

#### Scenario: Profile recorded
- **WHEN** install runs with `--profile knowledge`
- **THEN** the manifest records `profile: knowledge`

## ADDED Requirements

### Requirement: Profile at install
`migrate install` SHALL install the file set and managed-block variants of `--profile`, defaulting to the `profile` of an existing `specfold.yaml`, else `full`. It SHALL set `profile` in a `specfold.yaml` it creates and keep the value of an existing one unless `--profile` differs, in which case it SHALL exit with 2, writing nothing.

#### Scenario: Knowledge install
- **WHEN** `migrate install --from template --profile knowledge` runs in a repository without `specfold.yaml`
- **THEN** `specfold.yaml` sets `profile: knowledge` and `.agents/skills/sf-plan/` is not written

#### Scenario: Conflicting profile
- **WHEN** `specfold.yaml` sets `profile: full` and `migrate install --profile knowledge` runs
- **THEN** the command exits with 2 and no file changes
