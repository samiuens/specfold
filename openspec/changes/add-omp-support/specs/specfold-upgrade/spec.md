# Spec Delta

## ADDED Requirements

### Requirement: Tools at upgrade
The upgrader SHALL plan the kit-owned files of the tools in `tools` of `specfold.yaml`, and SHALL pass the tools except `omp` to `openspec init`. Without a `tools` key, it SHALL take the tools from the manifest as before: `claude` when the manifest lists a `.claude/` file or the `CLAUDE.md` block.

#### Scenario: Old repository without the key
- **WHEN** a repository without a `tools` key, whose manifest lists `.claude/agents/scout.md`, upgrades
- **THEN** the plan is the same as before the `tools` setting existed

### Requirement: omp adapter upgraded
When `tools` lists `omp`, the upgrader SHALL treat `.omp/hooks/pre/specfold.ts` as a kit-owned file whose new copy is the release's `.specfold/tools/omp/hooks/pre/specfold.ts`, and SHALL write it when missing. Without `omp`, it SHALL not create that file.

#### Scenario: Adapter replaced
- **WHEN** `tools` lists `omp`, `.omp/hooks/pre/specfold.ts` matches its manifest hash, and the new release changed the shipped adapter
- **THEN** the upgrade replaces `.omp/hooks/pre/specfold.ts` with the new copy

#### Scenario: omp added before an upgrade
- **WHEN** a user adds `omp` to `tools` and runs `specfold upgrade --yes` at the installed version
- **THEN** `.omp/hooks/pre/specfold.ts` exists afterwards, and the follow-up `specfold agents sync` writes the omp roles
