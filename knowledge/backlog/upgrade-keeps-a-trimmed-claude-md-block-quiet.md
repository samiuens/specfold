---
type: Backlog Item
title: Upgrade keeps a trimmed CLAUDE.md block quiet
description: "upgrade applies the @AGENTS.md import rule itself, so a trimmed CLAUDE.md block is no merge or conflict when nothing changed."
status: draft
state: open
priority: medium
origin: verify
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T10:53:30+01:00 }
sources: []
---

# Idea

When `CLAUDE.md` already imports `@AGENTS.md` outside the managed block, `migrate install` writes the block without its own import but records the hash of the full template block. `upgrade` therefore never matches the hash and always treats the block as edited locally: with the installed release as base it merges correctly (one import), but it reports a merge on every upgrade, and it ends in a conflict when the base cannot be fetched or a release changes the lines next to the import. Applying the same import rule in `upgrade` would make the unchanged case quiet.

# Why it waits

The normal upgrade path merges correctly and never restores the duplicate import. Found by the verifier of `fix-migration-findings` (2026-11-02) and moved here instead of widening that change to `upgrade`.

# Related

- [specfold upgrade](/capabilities/specfold-upgrade.md)
- [specfold migrate](/capabilities/specfold-migrate.md)
