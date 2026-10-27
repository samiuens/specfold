---
type: Decision
title: Kit content in repo-owned files lives in managed blocks
description: Specfold writes its part of AGENTS.md, CLAUDE.md and similar files between specfold markers, the only part upgrades rewrite.
status: draft
decision: accepted
change: 2026-10-27-add-specfold-migrate
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-27T12:25:39+01:00 }
sources:
  - id: brief
    resource: ../../openspec/changes/archive/2026-10-27-add-specfold-migrate/brief.md
    title: "Brief of add-specfold-migrate, decision Q4"
---

# Decision

When Specfold has to put its content into a file the repository already owns (`AGENTS.md`, `CLAUDE.md`, the PR template, `.gitignore`, `CODEOWNERS`), it writes the template file's text between `specfold:start` and `specfold:end` markers: HTML comments in Markdown, at the top; hash comments elsewhere, at the end. Text outside the markers is never changed, a rerun replaces only the block, and a start marker without an end is reported instead of guessed at.

# Why

A team's own instructions must survive the migration word for word, and M9's upgrader needs to know exactly which part of a shared file is Specfold's to rewrite. The block's hash in `.specfold/manifest.json` tells it whether someone edited the block since.

# Rejected alternatives

- Replacing the file with Specfold's and moving the old text into a section below: the team's text would move, and an upgrade could not tell kit text from team text.

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
- [Versioning](/decisions/versioning.md)
