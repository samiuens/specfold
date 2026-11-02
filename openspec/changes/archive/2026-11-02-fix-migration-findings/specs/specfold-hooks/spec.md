## ADDED Requirements

### Requirement: Claude stop summary
When `specfold hook claude-stop` blocks with more than 20 blocking findings, it SHALL print the count per rule and the first 10 findings, followed by a line naming how many findings it did not show, instead of every finding.

#### Scenario: Many blocking findings
- **WHEN** Claude tries to stop while the local gate reports 214 blocking findings, 200 of them G1 and 14 of them G2
- **THEN** stderr shows `G1: 200` and `G2: 14`, the first 10 findings, and a line naming the 204 findings not shown, and the command exits with 2

## MODIFIED Requirements

### Requirement: Claude stop
`specfold hook claude-stop` SHALL run the local gate against the same base as the pre-push hook and, when a blocking rule fails, print the blocking findings to stderr and exit with 2, also when the event says a Stop hook is already active; otherwise, or when no base resolves, exit with 0. G15 findings for scenarios of changes not yet archived SHALL NOT block: they go to stderr marked as not blocking.

#### Scenario: Unfinished work
- **WHEN** Claude tries to stop while a touched change has an unconfirmed brief
- **THEN** the G13 finding goes to stderr and the command exits with 2

#### Scenario: Scenario without a test in an active change
- **WHEN** Claude tries to stop while an active change with a tasks.md has a scenario no test names, and nothing else blocks
- **THEN** the G15 finding goes to stderr marked "not blocking: the change is still in progress" and the command exits with 0

#### Scenario: Scenario without a test in an archived change
- **WHEN** Claude tries to stop while a change archived on the branch has a scenario no test names
- **THEN** the G15 finding goes to stderr and the command exits with 2

### Requirement: Hook manager files keep long lines
When `specfold hooks install` adds its entries to `lefthook.yml` or `.pre-commit-config.yaml`, it SHALL keep the text of every line it does not need to change as it was, including long lines, flow sequences, block scalars and line endings. It MAY rewrite only `default_install_hook_types` when a hook type is missing from it, and a hook section, its `commands` or `jobs`, or pre-commit `repos` that is in flow style, empty or null; then only that node's text changes.

#### Scenario: Long lefthook command kept
- **WHEN** `lefthook.yml` has a 100-character `run` command and `hooks install` adds Specfold's entries
- **THEN** that command is still on one line

#### Scenario: Lefthook formatting kept
- **WHEN** `lefthook.yml` has a flow sequence `glob: ["*.ts", "*.tsx"]` and a folded `run: >-` scalar, and `hooks install` adds Specfold's entries
- **THEN** every line that was in the file before is unchanged

#### Scenario: Flow-style hook section filled in place
- **WHEN** `lefthook.yml` has `pre-commit: { commands: { lint: { run: eslint } } }` and a comment line, and `hooks install` runs
- **THEN** only the `pre-commit` node's text changes, it holds the `specfold` command and `lint`, and every other line is unchanged

#### Scenario: Empty pre-commit sections filled in place
- **WHEN** `.pre-commit-config.yaml` has `repos: []`, a bare `default_install_hook_types:` key and a comment line, and `hooks install` runs
- **THEN** only those two nodes' text changes, they hold Specfold's local repo and hook types, no line ends in whitespace, and every other line is unchanged

#### Scenario: CRLF line endings kept
- **WHEN** `lefthook.yml` uses CRLF line endings and `hooks install` adds Specfold's entries
- **THEN** every line of the result, the inserted ones included, ends in CRLF
