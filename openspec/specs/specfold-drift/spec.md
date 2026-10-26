# specfold-drift Specification

## Purpose
Defines `specfold drift`, which finds concepts whose dependent repository files changed after the concept was last written or verified.

## Requirements

### Requirement: Drift command
The CLI SHALL provide `specfold drift [<path>...] [--json]`, which checks the named concepts, or every concept in the bundle when no path is given. It SHALL exit with 0 when no checked concept is possibly stale, 1 when any is, and 2 on usage or environment errors such as running outside a git repository.

#### Scenario: Nothing drifted
- **WHEN** no dependent file changed after any concept's baseline
- **THEN** `specfold drift` prints a summary with 0 concepts and exits with 0

### Requirement: Dependent paths
A concept's dependent paths SHALL be its `resource` and each `sources[].resource` that resolves to an existing repository file or folder (bundle-absolute, or relative to the concept file, as for rule L2 of `specfold validate`), and every file matching `source_globs` whose `see knowledge:` comment names the concept. URLs SHALL be ignored, and a folder SHALL stand for every file below it.

#### Scenario: Code reference
- **WHEN** `src/retry.ts` contains `// see knowledge: /decisions/retries.md`
- **THEN** `src/retry.ts` is a dependent path of `decisions/retries.md`

#### Scenario: URL source
- **WHEN** a concept's only source is `https://example.com/docs`
- **THEN** the concept has no dependent paths and is never possibly stale

### Requirement: Baseline
A concept's baseline SHALL be the later of its latest `verified[].at`, or `generated.at` when it has no `verified` entry, and the committer date of the last commit that changed the concept file. A concept is possibly stale when a commit with a later committer date changed one of its dependent paths.

#### Scenario: Code changed after verification
- **WHEN** a concept was verified on 2026-10-01, its file was last committed then, and `src/retry.ts` was committed on 2026-10-10
- **THEN** the concept is possibly stale, triggered by that commit

#### Scenario: Concept edited after the code
- **WHEN** `src/retry.ts` was committed on 2026-10-10 and the concept file on 2026-10-12
- **THEN** the concept is not possibly stale

### Requirement: Drift output
Without `--json`, the command SHALL print each possibly stale concept with the triggering commits (short hash, date, subject and the dependent paths they changed) and a summary line. With `--json`, it SHALL print `{"ok", "concepts", "counts"}`, where each concept carries `path`, `baseline` and `commits`.

#### Scenario: JSON report
- **WHEN** one concept is possibly stale and `--json` is set
- **THEN** stdout parses as JSON with `"ok": false` and that concept with at least one commit
