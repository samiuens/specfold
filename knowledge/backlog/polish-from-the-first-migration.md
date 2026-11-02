---
type: Backlog Item
title: Polish from the first migration
description: "Generated header on the bundled CLI, install note on the upgrade workflow, D7 migration hint, stats skill split, merge=union doc line."
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T09:55:31+01:00 }
---

# Idea

Small points from the Atrium migration:

- a `// @generated` header on `scripts/specfold.mjs` and a note on excluding it from linters (it produced about 230 Biome errors);
- a line in install's output when `.specfold/workflows/specfold-upgrade.yml` is written although the upgrade workflow was declined;
- a D7 hint that the gate is expected not to be required while a migration is active;
- `stats` reporting the kit's skills apart from the repository's own;
- one line in the docs on the `merge=union` attribute for `knowledge/log.md`.

# Why it waits

None of them blocks a migration. Moved here in the `fix-migration-findings` interview (2026-11-02).

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
