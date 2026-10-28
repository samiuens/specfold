---
type: Backlog Item
title: Read barriers for other agents
description: Ignore or permission files for agents other than Claude Code (Codex, Cursor and others), matching the template's Claude Code deny list.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T08:39:00+01:00 }
---

# Idea

M7 ships read barriers only for Claude Code: `permissions.deny` rules in the template's `.claude/settings.json`. Other agents have their own ignore or permission files; the same list of lockfiles, build output and generated files could reach them too.

Left out of M7 in its planning interview (`add-token-recipes`).

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
