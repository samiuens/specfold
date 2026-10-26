# specfold-lookup Specification

## Purpose
Finds concepts in a knowledge bundle by searching frontmatter only, ranks them deterministically and shows each hit's trust tier in one line.

## Requirements

### Requirement: Command line
The CLI SHALL provide `specfold lookup <query...> [--type <type>] [--limit <n>] [--bundle <dir>] [--json]`. The bundle root SHALL default to `knowledge/` under the repository root and be overridable with `--bundle`. An empty query or a `--limit` that is not a positive integer SHALL be a usage error with exit code 2.

#### Scenario: Missing query
- **WHEN** a user runs `specfold lookup` without words
- **THEN** the command prints a usage error and exits with 2

#### Scenario: Invalid limit
- **WHEN** a user runs `specfold lookup checkout --limit 0`
- **THEN** the command prints a usage error and exits with 2

### Requirement: Frontmatter matching
A concept SHALL match when every query word, compared case-insensitively, is a prefix of a word in its `title`, `tags`, `description` or `type`, where words are split on characters that are not letters or digits. Concept bodies, `index.md`, `log.md` and concepts without parseable frontmatter SHALL NOT be searched.

#### Scenario: All words must match
- **WHEN** one concept's title is "Guest checkout" and another's is "Guest accounts", and a user looks up `guest check`
- **THEN** only "Guest checkout" is returned

#### Scenario: Prefix match
- **WHEN** a concept's description contains "verified" and a user looks up `verif`
- **THEN** the concept is returned

#### Scenario: Body ignored
- **WHEN** a word appears only in a concept's body
- **THEN** looking up that word does not return the concept

### Requirement: Ranking
Each match SHALL score, per query word, the highest weight of the fields it matched: title 3, tags 2, description 1, type 1. Results SHALL be ordered by total score descending, then by path, and cut to `--limit` (default 10).

#### Scenario: Title beats description
- **WHEN** concept A has "token" in its title and concept B only in its description, and a user looks up `token`
- **THEN** A is listed before B

#### Scenario: Ties by path
- **WHEN** two concepts score the same
- **THEN** the one with the lexically smaller path comes first

#### Scenario: Limit applied
- **WHEN** 12 concepts match and no limit is given
- **THEN** 10 results are printed

### Requirement: Type filter
With `--type <type>`, only concepts whose `type` equals the given value, compared case-insensitively, SHALL be returned.

#### Scenario: Only decisions
- **WHEN** a user looks up `checkout --type decision`
- **THEN** only concepts with `type: Decision` are returned

### Requirement: Trust flags
Each result SHALL carry the flags that apply, in this order: `deprecated` when `status` is `deprecated`, `stale` when `stale_after` is before the current time, `unverified` when there is no `verified` entry.

#### Scenario: Stale and unverified
- **WHEN** a matching concept has `stale_after: 2020-01-01T00:00:00Z` and no `verified`
- **THEN** its result carries the flags `stale` and `unverified`

### Requirement: Human output
Without `--json`, the command SHALL print one line per result: `<repo-relative path> - <title>: <description>`, followed by ` [<flags>]` when flags apply, comma-separated. When nothing matches, it SHALL print `no matches`. The exit code SHALL be 0 in both cases.

#### Scenario: One line per hit
- **WHEN** a deprecated, unverified concept "Old checkout" with description "Replaced." matches
- **THEN** the line reads `knowledge/decisions/old-checkout.md - Old checkout: Replaced. [deprecated, unverified]`

#### Scenario: No hits
- **WHEN** nothing matches
- **THEN** the output is `no matches` and the exit code is 0

### Requirement: JSON output
With `--json`, the command SHALL print one object `{"query": <string>, "results": [{"path", "title", "description", "type", "score", "flags"}]}` with paths relative to the repository root, `description` as `null` when absent, and `flags` as a list.

#### Scenario: Machine-readable hits
- **WHEN** a user runs `specfold lookup token --json` and one concept matches
- **THEN** stdout parses as JSON with one result carrying `path`, `score` and `flags`
