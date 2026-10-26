# Spec Delta

## Purpose

Defines `specfold audit`, a bundle-wide report of slow decay in the knowledge bundle: stale and long-unverified concepts, links to deprecated concepts, orphaned concepts and specs without a capability card.

## ADDED Requirements

### Requirement: Audit command
The CLI SHALL provide `specfold audit [--json]`, which checks the whole bundle and the main specs against rules A1-A5, and SHALL exit with 0 when there is no finding, 1 when there is any, and 2 on usage or environment errors.

#### Scenario: Clean bundle
- **WHEN** no concept breaks any audit rule
- **THEN** `specfold audit` prints a summary with 0 findings and exits with 0

### Requirement: Audit output
Every finding SHALL carry a rule id, the severity `warning`, the path (bundle-relative for concepts, repository-relative for specs), a line number when one applies, a message and a fix hint. With `--json`, the command SHALL print `{"ok", "findings", "counts"}`, where `counts` maps each rule id to its number of findings; without it, one line per finding and a summary line.

#### Scenario: JSON report
- **WHEN** one concept is stale and `--json` is set
- **THEN** stdout parses as JSON with `"ok": false`, a finding with `"rule": "A1"` and `"counts": {"A1": 1}`

### Requirement: A1 stale concept
The command SHALL report rule `A1` for every concept whose `stale_after` is before the current time.

#### Scenario: Expired reference
- **WHEN** a Reference has `stale_after: 2020-01-01T00:00:00Z`
- **THEN** an `A1` finding names it

### Requirement: A2 long unverified
The command SHALL report rule `A2` for every concept without a `verified` entry whose `generated.at` is more than `audit.unverified_after_days` days before the current time, defaulting to 30.

#### Scenario: Old draft
- **WHEN** a concept has no `verified` and `generated.at: 2020-01-01T00:00:00Z`
- **THEN** an `A2` finding names it

#### Scenario: Fresh draft
- **WHEN** a concept has no `verified` and was generated yesterday
- **THEN** no `A2` finding is reported for it

### Requirement: A3 link to a deprecated concept
The command SHALL report rule `A3` on every concept that is not deprecated and links to a concept with `status: deprecated`, with the line of the link.

#### Scenario: Link to deprecated decision
- **WHEN** `capabilities/checkout.md` links to `/decisions/old-checkout.md`, which is deprecated
- **THEN** an `A3` finding on `capabilities/checkout.md` names the link target

### Requirement: A4 orphaned concept
The command SHALL report rule `A4` for every concept that nothing points to: no other concept links to it, no `see knowledge:` reference in `source_globs` names it, and the repository's root `AGENTS.md` and `CLAUDE.md` do not name its bundle-absolute path. Links from `index.md` and `log.md` SHALL not count. Capability cards whose `spec` exists and concepts under `vision/` and `backlog/` SHALL be exempt.

#### Scenario: Unlinked term
- **WHEN** `domain/ledger.md` is linked only from `domain/index.md`
- **THEN** an `A4` finding names it

#### Scenario: Referenced from code
- **WHEN** no concept links to `decisions/retries.md` but `src/client.ts` contains `// see knowledge: /decisions/retries.md`
- **THEN** no `A4` finding is reported for it

#### Scenario: Named in AGENTS.md
- **WHEN** no concept links to `conventions/code-comments.md` but `AGENTS.md` mentions `/conventions/code-comments.md`
- **THEN** no `A4` finding is reported for it

#### Scenario: Backlog item
- **WHEN** `backlog/dark-mode.md` has no incoming links
- **THEN** no `A4` finding is reported for it

### Requirement: A5 spec without capability card
The command SHALL report rule `A5` for every main spec `openspec/specs/<cap>/spec.md` that no Capability concept names in its `spec` key.

#### Scenario: Missing card
- **WHEN** `openspec/specs/checkout/spec.md` exists and no Capability has `spec: openspec/specs/checkout/spec.md`
- **THEN** an `A5` finding names `checkout`
