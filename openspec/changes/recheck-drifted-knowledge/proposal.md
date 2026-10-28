# Proposal

## Why

After M6, `specfold drift` flags 30 of the kit's 71 checked concepts. Twenty-eight cite `docs/plan.md`, which six plan edits on 2026-10-26 changed (task breakdown, kit-only tooling, the schema copy, milestone moves); `conventions/test-fixtures.md` follows a test helper, and `runbooks/move-bootstrap-pin.md` follows `BOOTSTRAP.md`, which every routine pin move changes. A flag that stays up teaches agents to ignore it ([specfold drift](/capabilities/specfold-drift.md)), so each concept is re-checked once and either fixed or handed to a human for verification ([humans verify only](/decisions/humans-verify-only.md)).

## What Changes

- **Fixes for real mismatches** found in the re-check:
  - `decisions/naming-specfold.md` and two lines of `docs/plan.md` name the markers `specfold:start` / `specfold:end`, as built;
  - `decisions/english-only.md` says the template's OpenSpec context carries the English line, which `template/openspec/config.yaml` and the sample app's config gain (the kit's own config already has it);
  - `conventions/test-fixtures.md`: `specfold trace` exists now, and `run` takes optional stdin;
  - `decisions/skills-symlinked-for-claude.md`: OpenSpec's own skill copies in `.claude/skills/` are real folders that `agents sync` keeps.
- **`runbooks/move-bootstrap-pin.md`** names `BOOTSTRAP.md` in its steps instead of in `sources`.
- **The 24 concepts that still hold** are listed in the PR with a one-line reason each; the user verifies the ones they agree with using `specfold verify`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- none

## Out of scope

- A drift ignore setting or any other CLI behavior change.
- Concepts that `specfold drift` does not flag today.

## Impact

- `knowledge/` (six concepts), `docs/plan.md`, `template/openspec/config.yaml`, `examples/sample-app/openspec/config.yaml`. No code.
