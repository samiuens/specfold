# Proposal

## Why

Setup problems (an old Node, a missing or incompatible OpenSpec, git hooks not installed, a broken `specfold.yaml`) show up later as confusing failures in hooks or CI. `specfold doctor` checks them in one place, for humans after cloning and for `BOOTSTRAP.md` before migrating. See `/decisions/built-in-git-hooks.md`.

## What Changes

- New command `specfold doctor [--json]` with checks D1 to D6. Each one reports `ok`, `warn` or `fail`, with a fix hint.

## Capabilities

### New Capabilities
- `specfold-doctor`: environment and configuration checks for a repository using Specfold.

### Modified Capabilities
- none

## Out of scope

- Manifest and version-skew checks, config drift (M9, with the upgrader).
- Repairing anything: doctor only reports.

## Open points for review

1. **Missing OpenSpec is a failure:** the workflow depends on OpenSpec. Missing graphify is fine (`ok`, reported as optional).
2. **Hooks not installed is a warning:** the CI gate stays the enforcement.
3. **Range syntax:** `requires.openspec` uses space-separated comparators (`>=1.15 <2`), with `>=1.15 <2` as the default when the key is absent.
4. **Exit codes:** 1 when any check fails, 0 otherwise (warnings included), 2 on usage errors.

## Impact

- New module in `tools/specfold/src/`; it runs `openspec --version`, `git config` and `graphify --version` as child processes.
