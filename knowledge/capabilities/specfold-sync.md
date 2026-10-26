---
type: Capability
title: specfold sync
description: Why sync applies the mechanical part of a knowledge delta after archive, and where its contract lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:21:37+01:00 }
---

# Why

Once a change is archived, its knowledge delta has to land in the bundle:
- capability cards point at the archived spec and change;
- deprecated concepts get flagged;
- indexes and the log are updated.

Done by hand, these steps get forgotten or come out slightly wrong. `specfold sync` does them deterministically, so the agent, or the `sf-sync` skill in M3, only writes prose ([deterministic CLI](/decisions/deterministic-cli.md)). It runs after archive, because the archived id (`<date>-<name>`) only exists then. The Knowledge task group has already written the bodies before archive ([write before, sync after](/decisions/write-knowledge-before-sync-after.md)).

# Choices made while specifying and building

- **Idempotent by comparison.** A key is set only when it differs, a source added only when its resource is missing, the log entry added only when no line names the id. A second run changes nothing.
- **Line-level frontmatter edits.** Untouched keys, comments and flow lists keep their exact text; only the lines sync sets change. A round trip over the kit's own bundle guards this in the tests.
- **History on modified capabilities.** `change` always points at the latest change. Every synced change adds its own `proposal-<id>` and `design-<id>` sources, so the card keeps a link to each change that touched it.
- **Stubs are honest.** A stub takes its description from the op's summary and its title from the file name. Fields only an author can fill, such as a Decision's `sources`, stay empty, so `specfold validate` keeps reporting them.
- **Same rules as change check.** Before writing, sync re-checks the archived delta with the knowledge rules ([specfold change check](/capabilities/specfold-change-check.md)) and writes nothing on errors.

# Related

- [specfold schema](/capabilities/specfold-schema.md)
- [specfold CLI](/architecture/specfold-cli.md)
