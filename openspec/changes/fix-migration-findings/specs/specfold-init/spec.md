## MODIFIED Requirements

### Requirement: Detected settings
Without flags, init SHALL detect the stack from package files at the root and the source globs from the workspace patterns (package.json `workspaces`, `pnpm-workspace.yaml`) as `<pattern>/src/**`, else from the code folders present (`src`, `lib`, `app`, `apps`, `packages`), fill the `Stack:` line of the `openspec/config.yaml` context and `source_globs` in `specfold.yaml`, and print each value with where it came from. Flags SHALL override detection.

#### Scenario: TypeScript project
- **WHEN** the root holds `package.json`, `tsconfig.json` and `src/`, and init runs without flags
- **THEN** the context line reads `Stack: Node.js, TypeScript` and `source_globs` is `["src/**"]`

#### Scenario: Flag wins
- **WHEN** init runs with `--source-glob 'lib/**'` in the same repository
- **THEN** `source_globs` is `["lib/**"]`

#### Scenario: pnpm workspaces
- **WHEN** `pnpm-workspace.yaml` lists `apps/*` and `packages/*`, and init runs without flags
- **THEN** `source_globs` is `["apps/*/src/**", "packages/*/src/**"]`
