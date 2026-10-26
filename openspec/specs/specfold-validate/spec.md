# specfold-validate Specification

## Purpose
Checks a knowledge bundle for OKF v0.2 conformance, the Specfold profile and bundle-internal links, and reports findings with stable rule ids for humans, agents and CI.

## Requirements

### Requirement: Command line
The CLI SHALL provide `specfold validate [<path>...] [--bundle <dir>] [--okf-only] [--json]`. The bundle root SHALL default to `knowledge/` under the repository root (the nearest ancestor directory containing `specfold.yaml`) and SHALL be overridable with `--bundle`. Without paths, every Markdown file in the bundle SHALL be checked; with paths (files or folders inside the bundle), only those.

#### Scenario: Whole bundle by default
- **WHEN** a user runs `specfold validate` in a repository with `specfold.yaml` and `knowledge/`
- **THEN** every `.md` file under `knowledge/` is checked

#### Scenario: Selected paths
- **WHEN** a user runs `specfold validate knowledge/decisions/a.md knowledge/references`
- **THEN** only `a.md` and the files under `knowledge/references/` are checked

#### Scenario: Path outside the bundle
- **WHEN** a path argument lies outside the bundle root
- **THEN** the command prints a usage error naming the path and exits with code 2

#### Scenario: Other bundle root
- **WHEN** a user runs `specfold validate --okf-only --bundle fixtures/acme_retail`
- **THEN** the files under `fixtures/acme_retail/` are checked as one bundle

### Requirement: Exit codes
The command SHALL exit with 0 when no finding has severity `error`, with 1 when at least one does, and with 2 on usage or environment errors: unknown flag, missing bundle root, or a missing or unparseable `specfold.yaml` when profile rules are active.

#### Scenario: Only warnings
- **WHEN** the checked files produce warnings but no errors
- **THEN** the command exits with 0

#### Scenario: Errors present
- **WHEN** at least one finding has severity `error`
- **THEN** the command exits with 1

#### Scenario: Missing configuration
- **WHEN** `specfold validate` runs without `--okf-only` and no `specfold.yaml` is found
- **THEN** the command prints an environment error and exits with 2

### Requirement: Read-only
The command SHALL NOT create, modify or delete any file.

#### Scenario: Files unchanged
- **WHEN** `specfold validate` runs on a bundle with findings
- **THEN** every file in the repository is byte-identical afterwards

### Requirement: Findings
Every finding SHALL carry a rule id, a severity (`error` or `warning`), the file path relative to the bundle root, a line number when one applies, a message and a one-line fix hint. Findings SHALL be ordered by path, then line, then rule id, so identical input gives identical output.

#### Scenario: Deterministic order
- **WHEN** the same bundle is validated twice
- **THEN** both runs print the same findings in the same order

### Requirement: Human output
Without `--json`, the command SHALL print one line per error finding as `<path>:<line> <rule> <message>` (omitting `:<line>` when no line applies), followed by one summary line with the number of files checked, errors and warnings. Warnings SHALL appear only as a count.

#### Scenario: Error line and summary
- **WHEN** `decisions/a.md` has no `title` and another file has a warning
- **THEN** the output contains a line starting `decisions/a.md` with rule `P2`, and a summary line reporting 1 error and 1 warning

### Requirement: JSON output
With `--json`, the command SHALL print exactly one JSON object to stdout: `{"ok": <bool>, "checked": <int>, "errors": <int>, "warnings": <int>, "findings": [{"rule", "severity", "path", "line", "message", "fix"}]}`, listing warnings and errors. `line` SHALL be `null` when no line applies. `ok` SHALL be true exactly when `errors` is 0.

#### Scenario: Machine-readable result
- **WHEN** a user runs `specfold validate --json` on a bundle with one error
- **THEN** stdout parses as JSON with `"ok": false`, `"errors": 1` and one finding whose `severity` is `error`

### Requirement: OKF-1 parseable frontmatter
Every Markdown file in the bundle other than `index.md` and `log.md` SHALL start with a YAML frontmatter block that parses to a mapping; otherwise the command SHALL report an error with rule `OKF-1`.

#### Scenario: Missing frontmatter
- **WHEN** `domain/term.md` has no frontmatter block
- **THEN** an `OKF-1` error is reported for `domain/term.md`

#### Scenario: Invalid YAML
- **WHEN** a concept's frontmatter is not valid YAML
- **THEN** an `OKF-1` error is reported with the line of the parse error

### Requirement: OKF-2 non-empty type
Every frontmatter block of a concept SHALL contain a non-empty string `type`; otherwise the command SHALL report an error with rule `OKF-2`.

#### Scenario: Empty type
- **WHEN** a concept has `type: ""`
- **THEN** an `OKF-2` error is reported

### Requirement: OKF-3 index and log files
Each `index.md` below the bundle root SHALL have no frontmatter; the bundle-root `index.md` MAY have frontmatter containing only `okf_version`. Each `log.md` SHALL have no frontmatter, and its `##` headings SHALL be valid `YYYY-MM-DD` dates in descending order. Violations SHALL be errors with rule `OKF-3`.

#### Scenario: Frontmatter in a folder index
- **WHEN** `decisions/index.md` starts with a frontmatter block
- **THEN** an `OKF-3` error is reported

#### Scenario: Extra key in root index
- **WHEN** the root `index.md` frontmatter contains `okf_version` and `kit_version`
- **THEN** an `OKF-3` error is reported naming `kit_version`

#### Scenario: Log out of order
- **WHEN** `log.md` has `## 2026-10-01` before `## 2026-10-20`
- **THEN** an `OKF-3` error is reported

#### Scenario: Frontmatter in log
- **WHEN** `log.md` starts with a frontmatter block containing `type: Log`
- **THEN** an `OKF-3` error is reported

### Requirement: OKF-only mode
With `--okf-only`, the command SHALL apply only rules `OKF-1` to `OKF-3` and SHALL NOT read `specfold.yaml`. Unknown keys, unknown types, missing optional fields and broken links SHALL NOT produce findings in this mode.

#### Scenario: Plain OKF bundle passes
- **WHEN** a bundle whose concepts carry only `type` and arbitrary extra keys is checked with `--okf-only`
- **THEN** no findings are reported and the command exits with 0

#### Scenario: Patched sample passes, upstream sample fails
- **WHEN** the patched `acme_retail` fixture and the unpatched upstream copy are each checked with `--okf-only`
- **THEN** the patched copy has no findings, and the upstream copy has exactly the `OKF-3` error for `log.md` frontmatter

### Requirement: P1 known type
In profile mode, every concept's `type` SHALL be one of the `types` listed in `specfold.yaml`; otherwise the command SHALL report an error with rule `P1`.

#### Scenario: Unknown type
- **WHEN** a concept has `type: Glossary` and `Glossary` is not in `types`
- **THEN** a `P1` error is reported naming the allowed types in the fix hint

### Requirement: P2 title and description
In profile mode, every concept SHALL have a non-empty `title` and a non-empty `description` that is a single line of at most 160 characters; otherwise the command SHALL report an error with rule `P2`.

#### Scenario: Description too long
- **WHEN** a concept's `description` has 161 characters
- **THEN** a `P2` error is reported

#### Scenario: Multi-line description
- **WHEN** a concept's `description` contains a line break
- **THEN** a `P2` error is reported

### Requirement: P3 status
In profile mode, every concept SHALL have `status` set to `draft`, `stable` or `deprecated`; otherwise the command SHALL report an error with rule `P3`.

#### Scenario: Missing status
- **WHEN** a concept has no `status` key
- **THEN** a `P3` error is reported

### Requirement: P4 trust fields
In profile mode, every concept SHALL have `generated` or `verified`. `generated` SHALL be a mapping with `by` and `at`; `verified` SHALL be a list of such mappings or a single one. Each `by` SHALL match `<producer>/<version>`, `human:<id>` or `process:<id>`. Violations SHALL be errors with rule `P4`.

#### Scenario: Neither field
- **WHEN** a concept has neither `generated` nor `verified`
- **THEN** a `P4` error is reported

#### Scenario: Bare verified mapping accepted
- **WHEN** a concept has `verified: { by: human:ada, at: 2026-10-26T10:00:00Z }`
- **THEN** no `P4` finding is reported for it

#### Scenario: Malformed actor
- **WHEN** a concept has `generated: { by: claude, at: 2026-10-26T10:00:00Z }`
- **THEN** a `P4` error is reported for the actor `claude`

### Requirement: P5 timestamps with offset
In profile mode, `generated.at`, every `verified[].at`, `stale_after` and every `sources[].last_modified` SHALL be an ISO 8601 date-time with an explicit offset (`Z` or `±hh:mm`); otherwise the command SHALL report an error with rule `P5`.

#### Scenario: Offset missing
- **WHEN** a concept has `stale_after: 2026-11-25T00:00:00`
- **THEN** a `P5` error is reported

#### Scenario: Z and numeric offsets accepted
- **WHEN** timestamps use `2026-10-26T10:00:00Z` and `2026-10-26T10:00:00+01:00`
- **THEN** no `P5` finding is reported

### Requirement: P6 sources
In profile mode, every `Decision` SHALL have a non-empty `sources` list, and every `sources` entry of any concept SHALL have a non-empty `resource`; otherwise the command SHALL report an error with rule `P6`.

#### Scenario: Decision without sources
- **WHEN** a `Decision` has no `sources`
- **THEN** a `P6` error is reported

#### Scenario: Source without resource
- **WHEN** a `Reference` has a `sources` entry with only `id`
- **THEN** a `P6` error is reported

### Requirement: P7 stale_after for volatile types
In profile mode, every `Runbook` and every `Interface` SHALL have `stale_after`; otherwise the command SHALL report an error with rule `P7`.

#### Scenario: Runbook without stale_after
- **WHEN** a `Runbook` has no `stale_after`
- **THEN** a `P7` error is reported

### Requirement: P8 file names
In profile mode, every file and folder name in the bundle SHALL be kebab-case (lowercase letters, digits and single hyphens) with files ending in `.md`; otherwise the command SHALL report an error with rule `P8`.

#### Scenario: Camel case file name
- **WHEN** the bundle contains `architecture/PaymentService.md`
- **THEN** a `P8` error is reported

### Requirement: P9 no normative wording
In profile mode, a concept body SHALL NOT contain the words `SHALL` or `MUST` in uppercase outside inline code and fenced code blocks; otherwise the command SHALL report an error with rule `P9` at the line of the word.

#### Scenario: Normative sentence in knowledge
- **WHEN** a concept body contains "The service MUST retry twice."
- **THEN** a `P9` error is reported at that line, with a fix hint pointing to OpenSpec

#### Scenario: Quoted in code
- **WHEN** the word appears only inside backticks or a fenced code block
- **THEN** no `P9` finding is reported

### Requirement: P10 body length
In profile mode, a concept body longer than 300 lines SHALL produce a warning with rule `P10` suggesting a split into a folder with its own index.

#### Scenario: Long concept
- **WHEN** a concept body has 301 lines
- **THEN** a `P10` warning is reported and the exit code is unaffected

### Requirement: P11 extension keys
In profile mode, every `Decision` SHALL have `decision` set to `accepted`, `rejected` or `superseded`; a `supersedes` value SHALL name an existing concept; a `spec` value SHALL name an existing file relative to the repository root; a `not` value SHALL be a list of mappings with `term`, `why` and `instead`. Violations SHALL be errors with rule `P11`.

#### Scenario: Decision without decision key
- **WHEN** a `Decision` has no `decision` key
- **THEN** a `P11` error is reported

#### Scenario: Superseded target missing
- **WHEN** a `Decision` has `supersedes: /decisions/old.md` and that file does not exist
- **THEN** a `P11` error is reported

### Requirement: Unknown keys are preserved
The command SHALL NOT report findings for frontmatter keys it does not know, in any mode.

#### Scenario: Extra key
- **WHEN** a concept carries `owner_team: payments`
- **THEN** no finding is reported for that key

### Requirement: L1 bundle-internal links
In profile mode, every Markdown link in a concept body whose target is bundle-absolute (`/x.md`) or relative (no URL scheme) SHALL resolve to an existing file or folder in the bundle; anchors after `#` SHALL be ignored. A broken link SHALL be an error with rule `L1` when `gate.block_on_broken_links` is true or absent, and a warning when it is false.

#### Scenario: Broken bundle-absolute link
- **WHEN** a concept links to `/architecture/missing.md`
- **THEN** an `L1` error is reported at the line of the link

#### Scenario: External links ignored
- **WHEN** a concept links to `https://example.com/x.md`
- **THEN** no `L1` finding is reported

#### Scenario: Configured as warning
- **WHEN** `specfold.yaml` sets `gate.block_on_broken_links: false` and a link is broken
- **THEN** an `L1` warning is reported and the exit code is 0 if nothing else fails

### Requirement: L2 source paths
In profile mode, a `sources[].resource` or `resource` value without a URL scheme SHALL resolve to an existing file, either bundle-absolute or relative to the concept file; otherwise the command SHALL report an error with rule `L2`.

#### Scenario: Missing source file
- **WHEN** a concept has a source with `resource: ../../docs/missing.md`
- **THEN** an `L2` error is reported
