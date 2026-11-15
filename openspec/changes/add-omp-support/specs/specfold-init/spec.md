# Spec Delta

## MODIFIED Requirements

### Requirement: Setup steps
After filling the settings, init SHALL, for the full profile, run `openspec init --tools <tools>` with the `tools` except `omp` (default `agents,claude`), keeping the template's `openspec/config.yaml`; then, for every profile, `specfold agents sync`, `specfold permissions sync` and `specfold hooks install`, and write `.specfold/manifest.json` as `migrate install` does.

#### Scenario: Fresh template repository
- **WHEN** init runs in a new repository created from the template
- **THEN** `.agents/skills/openspec-propose/SKILL.md` exists, `config.yaml` still names `schema: specfold`, the git hooks are installed and the manifest exists

#### Scenario: Permissions rendered
- **WHEN** init runs in a new repository created from the template
- **THEN** `specfold permissions sync --check` exits with 0 afterwards and `.claude/settings.json` holds the `push` rules in `permissions.ask`

#### Scenario: Knowledge profile skips OpenSpec
- **WHEN** init runs with `--profile knowledge` and OpenSpec is not installed
- **THEN** init exits with 0, does not run `openspec init`, and the git hooks and manifest exist

#### Scenario: omp not passed to OpenSpec
- **WHEN** init runs with `--tools agents,claude,omp` in a new repository created from the template
- **THEN** `openspec init` runs with `--tools agents,claude`

## ADDED Requirements

### Requirement: Tools at init
`--tools` SHALL take a comma-separated list of `agents`, `claude` and `omp` that includes `agents`, and init SHALL write it as `tools` in `specfold.yaml`. Without the flag, init SHALL keep an existing `tools` value, else write `[agents, claude]`. Any other list SHALL be a usage error (exit 2).

#### Scenario: omp chosen
- **WHEN** init runs with `--tools agents,claude,omp`
- **THEN** `specfold.yaml` sets `tools: [agents, claude, omp]`

#### Scenario: Rerun keeps tools
- **WHEN** `tools` is `[agents, omp]` and init runs again without `--tools`
- **THEN** `tools` stays `[agents, omp]`

#### Scenario: Unknown tool at init
- **WHEN** init runs with `--tools agents,cursor`
- **THEN** init exits with 2, names the allowed tools, and changes no file

### Requirement: omp files at init
When `tools` lists `omp`, init SHALL copy `.specfold/tools/omp/hooks/pre/specfold.ts` to `.omp/hooks/pre/specfold.ts` and record it in the manifest as kit-owned, and keep the template's `.claude/agents/` files as the source of the omp roles even without `claude`. Without `omp`, init SHALL create nothing under `.omp/`.

#### Scenario: omp set up
- **WHEN** init runs with `--tools agents,omp` in a new repository created from the template
- **THEN** `.omp/hooks/pre/specfold.ts`, `.omp/agents/implementer.md` and `.omp/config.yml` exist, the manifest lists `.omp/hooks/pre/specfold.ts`, and `agents.targets` is empty

#### Scenario: omp left out
- **WHEN** init runs with the default tools
- **THEN** no `.omp/` folder exists afterwards
