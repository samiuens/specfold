# Proposal

## Why

`specfold doctor` on the kit repo failed D3 because OpenSpec only ran through `npx`, not from the PATH. Many Node repos install OpenSpec as a dev dependency, where the binary sits in `node_modules/.bin/` and is not on the PATH outside npm scripts. Accepting that binary makes D3 report what the repo actually uses. Decided by the maintainer on 2026-10-26, after dogfooding `add-specfold-doctor`.

## What Changes

- D3 runs `<repo>/node_modules/.bin/openspec --version` when that file exists, else `openspec --version` from the PATH. The version check stays the same.
- The kit repo pins `@fission-ai/openspec` 1.15.0 as a dev dependency, so hooks, CI and doctor use one version.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-doctor`: D3 also accepts a repository-local OpenSpec binary.

## Impact

- `tools/specfold/src/doctor/checks.ts`; root `package.json` and lockfile.
