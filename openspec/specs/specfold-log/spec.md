# specfold-log Specification

## Purpose
Appends dated entries to a knowledge bundle's `log.md` in the format OKF requires, so tools and agents never edit the log by hand.

## Requirements

### Requirement: Command line
The CLI SHALL provide `specfold log add [--kind <Kind>] [--date <YYYY-MM-DD>] [--bundle <dir>] <message...>`. The positional words SHALL form the message. A missing message, a kind that is not one word starting with an uppercase letter, or a date that is not a valid calendar date SHALL be usage errors with exit code 2.

#### Scenario: Missing message
- **WHEN** a user runs `specfold log add`
- **THEN** the command prints a usage error and exits with 2

#### Scenario: Invalid date
- **WHEN** a user runs `specfold log add --date 2026-02-30 Fixed`
- **THEN** the command prints a usage error and exits with 2

### Requirement: Entry format
The command SHALL write one line `* **<Kind>**: <message>`, with `<Kind>` defaulting to `Update` and line breaks and repeated whitespace in the message collapsed to single spaces, then print that line and exit with 0.

#### Scenario: Default kind
- **WHEN** a user runs `specfold log add Added the runbook`
- **THEN** the line `* **Update**: Added the runbook` is written

### Requirement: Date section
The entry SHALL go at the end of the section under `## <date>`, where `<date>` is `--date` or the machine's local date. A missing heading SHALL be inserted so that date headings stay in descending order.

#### Scenario: Existing heading
- **WHEN** `log.md` has `## 2026-10-26` with one entry and a user adds an entry dated 2026-10-26
- **THEN** the new entry follows the existing one under the same heading

#### Scenario: New newest date
- **WHEN** the newest heading is `## 2026-10-20` and a user adds an entry dated 2026-10-26
- **THEN** `## 2026-10-26` is inserted above `## 2026-10-20` with the entry

#### Scenario: Back-dated entry
- **WHEN** headings `## 2026-10-26` and `## 2026-10-01` exist and a user adds an entry with `--date 2026-10-10`
- **THEN** `## 2026-10-10` is inserted between them

### Requirement: Missing log
When the bundle has no `log.md`, the command SHALL create it with the title `# Log` followed by the date heading and the entry, and then rewrite the root `index.md` so it lists the log.

#### Scenario: First entry
- **WHEN** `knowledge/log.md` does not exist and a user adds an entry
- **THEN** `knowledge/log.md` contains `# Log`, the date heading and the entry

#### Scenario: Root index lists the new log
- **WHEN** `knowledge/log.md` does not exist, `knowledge/index.md` is current, and a user adds an entry
- **THEN** `knowledge/index.md` ends with the `# Log` section and `specfold index --check` reports nothing

### Requirement: Valid result
After the command, `log.md` SHALL pass `specfold validate` rule OKF-3, and content outside the inserted lines SHALL be unchanged.

#### Scenario: Still conformant
- **WHEN** entries are added for three different dates in random order
- **THEN** `specfold validate --okf-only` reports no OKF-3 finding for `log.md`
