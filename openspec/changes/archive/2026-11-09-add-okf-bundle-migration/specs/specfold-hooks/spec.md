# Spec Delta

## ADDED Requirements

### Requirement: Migration conversion state
A migration's conversion SHALL count as under way while `.specfold/migration/state.json` exists and does not record `convert` as done. A file under `knowledge/` SHALL count as an unchanged original while its content equals that file at the state's base commit.

#### Scenario: Convert marked
- **WHEN** `migrate mark convert` has run
- **THEN** no hook treats the conversion as under way

### Requirement: Commit and edit relief during a migration
While a conversion is under way, `specfold hook pre-commit` and `specfold hook claude-post-tool-use` SHALL print link findings (`L1`, `L2`) and findings in unchanged originals as warnings and not fail for them. Every other finding SHALL keep its effect.

#### Scenario: Link to a concept not written yet
- **WHEN** conversion is under way and a staged new concept links to `/decisions/secrets.md`, which does not exist yet
- **THEN** `specfold hook pre-commit` prints the link finding as a warning and exits with 0

#### Scenario: New concept still strict
- **WHEN** conversion is under way and a staged new concept lacks `title`
- **THEN** `specfold hook pre-commit` reports the error and exits with 1

#### Scenario: Conversion done
- **WHEN** `migrate mark convert` has run and a staged concept has a broken link
- **THEN** `specfold hook pre-commit` reports the link error and exits with 1

### Requirement: Stop relief during a migration
While a conversion is under way, `specfold hook claude-stop` SHALL not block for `G1` or `G10` findings that are link findings or lie in unchanged originals; it SHALL print them to stderr and exit with 0 when no other blocking finding remains. `specfold hook pre-push` and `specfold gate` SHALL not change.

#### Scenario: Half-converted bundle
- **WHEN** conversion is under way, an unchanged original `knowledge/architecture/adr-0011-secrets.md` has a description over 160 characters, and a new concept links to a concept not written yet
- **THEN** `specfold hook claude-stop` prints both findings and exits with 0

#### Scenario: Gate unchanged
- **WHEN** the same repository runs `specfold gate --base main --local`
- **THEN** both findings block
