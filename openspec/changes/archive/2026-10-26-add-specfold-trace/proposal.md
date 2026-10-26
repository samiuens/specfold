# Proposal

## Why

Scenarios are the testable part of the behavior contract (`/decisions/specs-vs-knowledge.md`). Nothing yet ties them to tests, so a scenario can ship untested and a test can keep naming a scenario that was renamed away. A stable scenario id that tests cite makes both gaps visible to a deterministic command and to the gate.

## What Changes

- New command `specfold trace [--change <name>] [--json]`: every scenario with the test files and lines that reference it, every uncovered scenario, and every reference to a scenario that does not exist.
- Scenario ids are `<capability-path>#<slug>`, the same rule `specfold tasks check` uses for task metadata.
- Test files are those matching `trace.test_globs` in `specfold.yaml`; defaults cover `**/*.test.*`, `**/*.spec.*`, `**/*_test.*`, `**/test/**`, `**/tests/**` and `**/spec/**`.
- New gate rule G15: a scenario added or modified by a change with `tasks.md` that the PR touches or archives needs a test reference (block); every dangling reference blocks; uncovered main-spec scenarios outside the PR's changes warn once, as a count.

## Capabilities

### New Capabilities
- `specfold-trace`: scenario-to-test traceability.

### Modified Capabilities
- `specfold-gate`: adds G15.

## Out of scope

- The verifier agent (M8), which will call `specfold trace --change`.

## Open points

1. **Removed scenarios:** scenarios under `REMOVED` requirements of an active change stop counting as known ids at once, so a test still naming one is a dangling reference before the archive.
2. **Dangling references always block**, in changed and unchanged files alike: they are fixed by editing one comment, and none exist on a branch that passed the gate.
3. **Old gaps** are reported as one `G15` warning with the count, not one warning per scenario, to keep migrated repositories readable.
4. **Exit codes:** `trace` exits with 1 when any scenario in scope is uncovered or any reference dangles, like `audit`.

## Impact

- New module `src/trace/`; reuses `scenarioSlug` from `src/tasks/scenarios.ts` and the glob matcher.
- `specfold.yaml` gains `trace.test_globs` (template and kit).
