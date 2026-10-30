# Proposal

## Why

`specfold hook claude-stop` blocks on every blocking local-gate finding. Rule G15 blocks for each scenario of an active change that no test names yet, which is true for the whole time a change is planned or being built. In a real session this turned the stop hook into a loop: every turn ended with the same G15 block until the last task group merged its tests. Claude Code's limit of consecutive blocks does not help across turns. The PR gate already enforces G15 before merge, so the stop hook adds noise, not safety, for changes still in progress.

Relies on [specfold hooks](/capabilities/specfold-hooks.md), [specfold gate](/capabilities/specfold-gate.md), [specfold trace](/capabilities/specfold-trace.md) and [Claude Code](/references/claude-code.md). No rejected decision covers this idea.

## What Changes

- `specfold hook claude-stop` reports G15 findings for scenarios of active (not archived) changes as warnings that do not block; it still exits with 2 for every other blocking finding.
- `specfold gate`, the pre-push hook and rule G15 itself do not change.

## Capabilities

### New Capabilities

### Modified Capabilities

- `specfold-hooks`: the "Claude stop" requirement no longer blocks on missing test references of changes still in progress.

## Impact

- `tools/specfold/src/hooks/claude.ts` (`stop`), its tests in `tools/specfold/test/hooks-claude.test.ts`, and the bundled `scripts/specfold.mjs` with its copies in `template/` and `examples/sample-app/`.
- User repos receive it with the next `specfold upgrade`.
