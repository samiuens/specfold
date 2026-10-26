---
type: Capability
title: specfold audit
description: Why audit reports slow decay in the bundle, and where the contract for specfold audit lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:22:47+01:00 }
---

# Why

`specfold validate` blocks what is broken now. Knowledge also decays slowly: references pass their `stale_after`, drafts sit unverified, links point at deprecated concepts, concepts become unreachable, and specs lose their capability card. `specfold audit` reports all of this deterministically. The `sf-audit` skill then only proposes fixes ([deterministic CLI](/decisions/deterministic-cli.md)), and a scheduled job can open an issue when the exit code is 1.

# Choices made while specifying and building

- **Unverified needs an age.** A concept without `verified` becomes a finding only after `audit.unverified_after_days` (default 30). Otherwise every fresh draft would be a finding and exit 1 would mean nothing.
- **What counts as a reference.** Links between concepts count, as do `see knowledge:` references in code and bundle-absolute paths named in the root `AGENTS.md` or `CLAUDE.md`. Generated indexes and the log don't. The instruction files were added after the first run on the template: there the code-comment convention is linked only from `AGENTS.md`.
- **Exempt folders.** `vision/` and `backlog/` concepts stand alone by nature. Capability cards with an existing spec are reachable through that spec.
- **The finding points at the fix.** A link to a deprecated concept is reported on the concept that links, at the line of the link.
- **No double checks.** Normative words in knowledge are already blocked by `specfold validate` (P9), so audit doesn't repeat that rule.

# Related

- [specfold change check](/capabilities/specfold-change-check.md)
- [specfold CLI](/architecture/specfold-cli.md)
