# Design

## Context

`src/tasks/scenarios.ts` already turns scenario titles into slugs and collects ids for task metadata, but it ignores delta sections. `src/indexes/refs.ts` scans files matching globs for `see knowledge:` comments, skipping large and binary files. The gate knows the touched active changes and the archived ones (`GateDiff`), and skips changes without `tasks.md` in G5 and G18. The kit's tests already cite scenarios as `// spec: <capability>#<slug>`.

## Goals / Non-Goals

**Goals:** one parser for main and delta specs; one scan for references, shared by `trace` and G15; no change to how existing tests cite scenarios.

**Non-Goals:** the verifier agent (M8); coverage of requirements without scenarios; checking that a test passes.

## Decisions

- **Module `src/trace/`:**
  - `specs.ts` parses a spec file into scenarios with capability, requirement, section (`main`, `ADDED`, `MODIFIED`, `REMOVED`, `RENAMED`), title, id and line;
  - `refs.ts` scans the test files;
  - `trace.ts` combines both into a report (scenarios with refs, dangling refs) for a scope;
  - `command.ts` prints it.
- **Delta sections:** the current `## ... Requirements` heading sets the section; `### Requirement:` sets the requirement. A `REMOVED` requirement removes every main-spec scenario of the same capability and requirement name from the known ids, even when the delta lists no scenarios for it.
- **Known ids:** the main specs' ids, plus `ADDED` and `MODIFIED` ids of active changes, minus removed ones. Scope without `--change`: every known id, each listed once with the first spec that defines it (main specs first). With `--change`: that change's `ADDED` and `MODIFIED` ids.
- **References:** `(?<![\w-])spec:\s*([a-z0-9][a-z0-9/-]*#[a-z0-9-]+)`. The lookbehind keeps `openspec:` from matching, and requiring `#` keeps `spec: openspec/specs/x/spec.md` keys in fixtures out. Files: `walkFiles` from the repository root, filtered by `trace.test_globs`, never under `node_modules/`, `knowledge/` or `openspec/`, skipping files over 1 MiB or with NUL bytes, like `refs.ts` in indexes.
- **Config:** `trace.test_globs` becomes `Config.traceTestGlobs`, a string list with the six defaults when absent.
- **G15** computes one report per gate run:
  - every touched active change with `tasks.md` and every archived change with `tasks.md` contributes its own `ADDED` and `MODIFIED` scenarios, each blocking when it has no reference, with the change's spec file and the scenario line;
  - every dangling reference blocks at its file and line;
  - uncovered main-spec ids outside those changes give one warning with the count.
- **Tests that mention references in fixture text** build the marker as `${"spec"}:`, so the kit's own scan never sees a fixture's reference as a dangling one.
- **The kit's setting:** `tools/specfold/test/**/*.test.ts`, so fixture repositories under `test/fixtures/` and the sample app never count as kit tests.

## Risks / Trade-offs

- [Slugs collide when two scenarios in one capability share a title] → they share one id; accepted, OpenSpec titles are unique in practice.
- [A reference in a non-test file inside a test folder counts] → accepted; `trace.test_globs` narrows it per repository.
