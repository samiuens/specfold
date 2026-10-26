# Proposal

## Why

Specfold's knowledge bundle is only trustworthy if every agent, hook and CI job gets the same verdict on whether it is well-formed. OKF ships no validator (see `/references/okf.md`), so `specfold validate` is the reference check for OKF conformance and for Specfold's stricter profile. Everything that must be correct is deterministic code (`/decisions/deterministic-cli.md`).

## What Changes

- New command `specfold validate [<path>...] [--bundle <dir>] [--okf-only] [--json]`.
- Checks the three OKF conformance rules, the Specfold profile (required frontmatter, vocabularies, timestamps, trust fields, naming, no normative wording in knowledge) and bundle-internal links.
- `--okf-only` checks only OKF conformance, so any OKF bundle (including the patched `acme_retail` fixture, `/decisions/acme-retail-patched-fixture.md`) can be checked without a `specfold.yaml`.
- Output follows the CLI conventions: human text by default, `--json` for agents and CI, exit codes 0/1/2.

## Capabilities

### New Capabilities
- `specfold-validate`: OKF conformance, profile and link validation of a knowledge bundle, with stable rule ids and machine-readable findings.

### Modified Capabilities
- none

## Out of scope

- Type-specific rules for `Vision`, `Deferred Commitment` and `Backlog Item` (`state`, `trigger`, `committed_by`, ...): added with M5, when those types get their commands.
- Rules that need git history or GitHub (human actors in `verified`, agent-written `human:` actors, staleness of touched concepts): those are gate rules G7, G8, G9.
- Index freshness: `specfold index --check` (`add-specfold-index`).

## Open points for review

Choices the plan does not settle; each is written into the spec as proposed below and can be changed in review.

1. **Warnings in human output:** printed only as a count in the summary line; listed individually with `--json`. (The plan says "only errors printed".)
2. **`decision` key required on every `Decision`:** proposed yes (`accepted`, `rejected`, `superseded`).
3. **Body length over 300 lines:** a warning, not an error (the plan says "about 300 lines").
4. **Broken links:** errors when `gate.block_on_broken_links` is true (default), otherwise warnings. Ignored entirely under `--okf-only`, because OKF requires consumers to tolerate broken links.
5. **Repo-relative `sources[].resource` paths** (non-URL) must resolve, relative to the concept file or bundle-absolute.
6. **Normative wording:** the uppercase words SHALL and MUST outside code spans and fenced code count as an error.

## Impact

- New CLI source under `tools/specfold/`, bundled into `scripts/specfold.mjs`; one runtime dependency (`yaml`).
- Fixture bundles under `tools/specfold/` (one valid, one per rule broken, patched and upstream `acme_retail`).
- Used later by the pre-commit hook, the Claude Code PostToolUse hook and gate rule G1.
