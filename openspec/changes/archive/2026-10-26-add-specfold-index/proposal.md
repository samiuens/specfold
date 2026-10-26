# Proposal

## Why

OKF indexes are the entry point for every lookup: an agent reads `index.md`, picks 1-3 concepts and stops. Hand-written indexes drift from the files they list, and agents writing them by hand waste tokens and make mistakes. `specfold index` generates every `index.md` deterministically, so indexes can be checked in CI (gate rule G2) and never merged by hand (`/decisions/deterministic-cli.md`, `/references/okf.md`).

## What Changes

- New command `specfold index [--check] [--bundle <dir>] [--json]`.
- Regenerates the bundle-root `index.md` (frontmatter `okf_version: "0.2"` only) and one `index.md` per folder, in OKF §8 format, grouped by concept type.
- Scans source files for `see knowledge:` comments and lists them under the concept they point to (`/decisions/code-comments-point-to-knowledge.md`).
- `--check` writes nothing and fails when an index is missing or out of date.
- New optional `specfold.yaml` key `folders` for folder titles and descriptions.

## Capabilities

### New Capabilities
- `specfold-index`: deterministic generation and freshness check of a bundle's `index.md` files, including code references to concepts.

### Modified Capabilities
- none

## Out of scope

- `log.md`: written by `specfold log add`, not by `index`.
- Blocking on references to missing or deprecated concepts: gate rule G14. `index` only reports them as warnings.

## Decisions

The open points of the first draft were accepted as proposed on 2026-10-26; they are recorded in `design.md`.

## Impact

- New CLI source under `tools/specfold/`; golden-file tests for index output.
- `specfold.yaml` gains the optional `folders` key.
- Replaces the hand-maintained indexes in the kit's own `knowledge/` once M1 ships.
