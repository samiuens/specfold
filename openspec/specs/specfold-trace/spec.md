# specfold-trace Specification

## Purpose
Defines `specfold trace`, which maps every OpenSpec scenario to the tests that reference it and reports uncovered scenarios and dangling references.

## Requirements

### Requirement: Trace command
The CLI SHALL provide `specfold trace [--change <name>] [--json]`. Without `--change`, it SHALL cover the scenarios of `openspec/specs/` and of the delta specs of every active change; with `--change`, only the scenarios of that change's `ADDED` and `MODIFIED` requirements. It SHALL exit with 0 when every scenario in scope has a reference and no reference dangles, 1 otherwise, and 2 on usage or environment errors such as an unknown change.

#### Scenario: Fully covered
- **WHEN** every scenario has a test reference and every reference names a known scenario
- **THEN** `specfold trace` prints a summary with 0 uncovered and 0 dangling and exits with 0

#### Scenario: Unknown change
- **WHEN** `specfold trace --change nope` runs and no active change `nope` exists
- **THEN** the command exits with 2 and names the change

### Requirement: Scenario ids
Each scenario SHALL have the id `<capability-path>#<slug>`, where `<capability-path>` is the spec's folder path below `specs/` and `<slug>` is the scenario title lowercased with every run of characters other than `a-z` and `0-9` replaced by one `-` and leading and trailing `-` removed. Scenarios under `REMOVED` requirements of an active change SHALL NOT count as known.

#### Scenario: Nested capability
- **WHEN** `openspec/specs/checkout/guest-checkout/spec.md` has the scenario `Guest pays without account`
- **THEN** its id is `checkout/guest-checkout#guest-pays-without-account`

#### Scenario: Removed in a change
- **WHEN** an active change lists a requirement under `REMOVED Requirements` and a test references one of its scenarios
- **THEN** that reference is reported as dangling

### Requirement: Test references
A test reference SHALL be the text `spec:` followed by optional spaces and a scenario id, anywhere in a file matching `trace.test_globs` in `specfold.yaml`. When the setting is absent, the globs SHALL be `**/*.test.*`, `**/*.spec.*`, `**/*_test.*`, `**/test/**`, `**/tests/**` and `**/spec/**`. Files under `node_modules/`, `knowledge/` and `openspec/` SHALL never count.

#### Scenario: Reference in a test name
- **WHEN** `tests/checkout_test.py` contains `def test_guest():  # spec: checkout#guest-pays`
- **THEN** the scenario `checkout#guest-pays` is covered by that file and line

#### Scenario: Reference outside test files
- **WHEN** only `src/checkout.ts` contains `spec: checkout#guest-pays`
- **THEN** the scenario is reported as uncovered

### Requirement: Trace output
Without `--json`, the command SHALL print one line per uncovered scenario, one line per dangling reference with its file and line, and a summary line with the numbers of scenarios, covered, uncovered and dangling. With `--json`, it SHALL print `{"ok", "scenarios", "dangling", "counts"}`, where each scenario carries its `id`, `spec` path and `refs` (file and line).

#### Scenario: JSON report
- **WHEN** one scenario has no reference and `--json` is set
- **THEN** stdout parses as JSON with `"ok": false` and that scenario with an empty `refs` list
