# Proposal

## Why

`specfold validate` blocks what is broken now; nothing reports what decays slowly: references past `stale_after`, drafts nobody verified for weeks, links to deprecated concepts, concepts nothing points to, and specs whose capability card is missing. `specfold audit` reports these deterministically, so the `sf-audit` skill only proposes fixes (`/decisions/deterministic-cli.md`), and the kit's own expired references become visible maintenance work (`docs/plan.md`, "Knowledge bundle profile").

## What Changes

- New command `specfold audit [--json]`, rules A1-A5, exit 1 on any finding.
- New `specfold.yaml` key `audit.unverified_after_days` (default 30).

## Capabilities

### New Capabilities
- `specfold-audit`: bundle-wide report of stale, long-unverified, deprecated-but-linked and orphaned concepts and of specs without a capability card.

### Modified Capabilities
- none

## Out of scope

- Normative words in knowledge: `specfold validate` already blocks them (P9), so audit does not repeat that check.
- Scheduled CI, G12, commitments and backlog checks (M4, M5).

## Confirmed in review

Confirmed by the maintainer on 2026-10-26, point by point:

1. **Unverified means old:** a concept without `verified` is reported only when its `generated.at` is more than `audit.unverified_after_days` (default 30) in the past. Without that age limit every fresh draft would be a finding and exit 1 would be meaningless.
2. **Orphan:** a concept that no other concept links to, no code references with `see knowledge:`, and the root `AGENTS.md` and `CLAUDE.md` do not name. Links from `index.md` and `log.md` do not count, since they are generated. Capability cards are not orphans when their spec exists, and `vision/` and `backlog/` concepts are exempt. AGENTS.md mentions and the backlog exemption were added on 2026-10-26, after the first audit run on the kit, the template and the sample app.
3. **Deprecated but linked:** reported on the linking concept, not the deprecated one, because the fix is in the linking concept. Links between two deprecated concepts are not reported.
4. **Spec without card:** a main spec `openspec/specs/<cap>/spec.md` without a Capability concept whose `spec` key names it.
5. **All findings are warnings** in severity (the bundle still validates), but any finding makes the exit code 1, as decided.

## Impact

- New CLI module and fixtures; `specfold.yaml` (kit and template) gains `audit.unverified_after_days`.
- Consumers: the `sf-audit` skill (`add-sf-skills`), the weekly audit and G12 (M4).
