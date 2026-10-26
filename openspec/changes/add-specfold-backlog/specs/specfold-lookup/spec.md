## ADDED Requirements

### Requirement: Vision and commitments
After the results, the command SHALL list every `Vision` concept and every `Deferred Commitment` with `state: open` whose frontmatter matches at least one query word, leaving out concepts already among the results and ignoring `--type` and `--limit`. Without `--json`, the block SHALL start with the line `vision and open commitments:` followed by one line per concept in the result format; it SHALL be left out when empty.

#### Scenario: Vision always shown
- **WHEN** a user looks up `checkout` and the bundle has one `Vision` concept that does not mention checkout
- **THEN** the output ends with the `vision and open commitments:` block listing that vision

#### Scenario: Matching commitment
- **WHEN** an open commitment titled "Keep checkout EU-hostable" exists and the query is `checkout`
- **THEN** the commitment appears either among the results or in the block, but not in both

## MODIFIED Requirements

### Requirement: JSON output
With `--json`, the command SHALL print one object `{"query": <string>, "results": [{"path", "title", "description", "type", "score", "flags"}], "context": [{"path", "title", "description", "type", "flags"}]}` with paths relative to the repository root, `description` as `null` when absent, `flags` as a list, and `context` holding the vision and open commitments block.

#### Scenario: Machine-readable hits
- **WHEN** a user runs `specfold lookup token --json` and one concept matches
- **THEN** stdout parses as JSON with one result carrying `path`, `score` and `flags`, and a `context` list
