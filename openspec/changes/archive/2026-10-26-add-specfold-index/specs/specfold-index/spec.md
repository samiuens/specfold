# Spec Delta

## Purpose

Generates every `index.md` of a knowledge bundle deterministically from the concepts' frontmatter and from `see knowledge:` references in code, and checks that committed indexes are up to date.

## ADDED Requirements

### Requirement: Command line
The CLI SHALL provide `specfold index [--check] [--bundle <dir>] [--json]`. The bundle root SHALL default to `knowledge/` under the repository root (the nearest ancestor directory containing `specfold.yaml`) and SHALL be overridable with `--bundle`.

#### Scenario: Default bundle
- **WHEN** a user runs `specfold index` in a repository with `specfold.yaml`
- **THEN** the indexes under `knowledge/` are regenerated

#### Scenario: No configuration
- **WHEN** no `specfold.yaml` is found
- **THEN** the command prints an environment error and exits with 2

### Requirement: One index per folder
The command SHALL write an `index.md` in the bundle root and in every folder below it, except folders whose name starts with `.`. Files other than `index.md` SHALL NOT be created, modified or deleted.

#### Scenario: New folder gets an index
- **WHEN** a concept is added in a new folder `knowledge/runbooks/`
- **THEN** `knowledge/runbooks/index.md` is created

#### Scenario: Concepts and log untouched
- **WHEN** `specfold index` runs
- **THEN** every concept file and `log.md` is byte-identical afterwards

### Requirement: Index files are generated
The command SHALL replace the whole content of each `index.md` it writes; hand-written content in an index SHALL NOT be preserved.

#### Scenario: Hand edit overwritten
- **WHEN** a user adds a paragraph to `decisions/index.md` and runs `specfold index`
- **THEN** the paragraph is gone and the file matches the generated content

### Requirement: Root frontmatter
The bundle-root `index.md` SHALL start with a frontmatter block containing only `okf_version: "0.2"`. Folder indexes SHALL have no frontmatter.

#### Scenario: Root index frontmatter
- **WHEN** `specfold index` runs on a bundle whose root index has no frontmatter
- **THEN** the root `index.md` starts with `---`, `okf_version: "0.2"`, `---`

### Requirement: Subfolder entries
Each index SHALL first list its direct subfolders under a `# Sections` heading as `* [<title>](<name>/) - <description>`, sorted by folder name. Title and description SHALL come from `specfold.yaml` `folders.<path>`; without them, the title SHALL be the folder name with hyphens as spaces and the first letter uppercased, and ` - <description>` SHALL be omitted.

#### Scenario: Configured folder
- **WHEN** `specfold.yaml` sets `folders.decisions` to title `Decisions` and description `Decisions about the kit`
- **THEN** the root index contains `* [Decisions](decisions/) - Decisions about the kit`

#### Scenario: Unconfigured folder
- **WHEN** a folder `data-flows` has no `folders` entry
- **THEN** its parent index contains `* [Data flows](data-flows/)`

### Requirement: Log entry in root index
When the bundle root contains `log.md`, the root index SHALL list it last, under a `# Log` heading, as `* [Log](log.md) - Dated record of changes to this bundle`.

#### Scenario: Log listed
- **WHEN** `knowledge/log.md` exists
- **THEN** the root index ends with a `# Log` section linking `log.md`

### Requirement: Concept entries grouped by type
After the sections, each index SHALL list the concepts in its folder, grouped under `# <type>` headings in the order of `types` in `specfold.yaml`, followed by unknown types in alphabetical order. Within a group, entries SHALL be sorted by title (case-insensitive), then by file name, as `* [<title>](<file>) - <description>`.

#### Scenario: Grouping and order
- **WHEN** a folder holds Decisions titled "b" and "A" and a Reference "C", and `types` lists Decision before Reference
- **THEN** the index shows `# Decision` with "A" then "b", followed by `# Reference` with "C"

#### Scenario: Missing title or description
- **WHEN** a concept has no `title`
- **THEN** its entry uses the file name without `.md` as title, and without a description it omits ` - <description>`

### Requirement: Deprecated concepts marked
A concept with `status: deprecated` SHALL stay listed, with ` (deprecated)` directly after its link.

#### Scenario: Deprecated entry
- **WHEN** `decisions/old.md` has `status: deprecated`
- **THEN** its entry reads `* [<title>](old.md) (deprecated) - <description>`

### Requirement: Empty folders
An index of a folder without concepts or subfolders SHALL contain only a `# <folder title>` heading and the line `No concepts yet.`

#### Scenario: Empty runbooks folder
- **WHEN** `knowledge/runbooks/` contains only its index
- **THEN** its index reads `# Runbooks`, an empty line and `No concepts yet.`

### Requirement: Code references
The command SHALL scan files matching `source_globs` in `specfold.yaml` for `see knowledge: <path>` (bundle-absolute path to a `.md` file, optionally followed by ` - <label>`) and list each reference under the referenced concept's entry as `  * Referenced from code: <repo-relative path>:<line>`, sorted by path and line.

#### Scenario: Reference listed
- **WHEN** `src/checkout.ts` line 12 contains `// see knowledge: /decisions/guest-orders.md`
- **THEN** the entry for `guest-orders.md` in `decisions/index.md` has a nested line `  * Referenced from code: src/checkout.ts:12`

#### Scenario: Reference to a missing concept
- **WHEN** a source file references `/decisions/missing.md`
- **THEN** the command reports a warning with the source location and the exit code is unaffected

### Requirement: Deterministic output
Generated indexes SHALL be UTF-8 with LF line endings, exactly one trailing newline, one blank line between blocks, and no timestamps or other run-dependent content, so the same input always produces byte-identical files.

#### Scenario: Two runs, same bytes
- **WHEN** `specfold index` runs twice without changes in between
- **THEN** the second run changes no file

### Requirement: Unparseable concepts
A concept whose frontmatter cannot be parsed SHALL be left out of its index and reported as an error finding; the command SHALL still write all indexes and exit with 1.

#### Scenario: Broken concept skipped
- **WHEN** `decisions/bad.md` has invalid YAML frontmatter
- **THEN** `decisions/index.md` is written without it, an error names `decisions/bad.md`, and the exit code is 1

### Requirement: Check mode
With `--check`, the command SHALL NOT write any file; it SHALL exit with 1 and list every `index.md` that is missing or differs from the generated content, and exit with 0 when all match.

#### Scenario: Outdated index
- **WHEN** a concept was added without running `specfold index`, and `specfold index --check` runs
- **THEN** the folder's `index.md` is listed as out of date, no file changes, and the exit code is 1

#### Scenario: Up to date
- **WHEN** all indexes match the generated content
- **THEN** `specfold index --check` exits with 0

### Requirement: Output and exit codes
The command SHALL exit with 0 on success, 1 on findings or outdated indexes, and 2 on usage or environment errors. With `--json` it SHALL print one JSON object: `{"ok": <bool>, "written": [<path>], "outdated": [<path>], "findings": [{"rule", "severity", "path", "line", "message", "fix"}]}`, with paths relative to the repository root.

#### Scenario: JSON in check mode
- **WHEN** `specfold index --check --json` finds one outdated index
- **THEN** stdout parses as JSON with `"ok": false`, `"written": []` and that index in `"outdated"`
