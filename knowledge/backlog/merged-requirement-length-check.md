---
type: Backlog Item
title: Merged requirement length check
description: Check before archive that every requirement a change merges into the main specs stays under OpenSpec's 500 characters.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T19:16:26+01:00 }
---

# Idea

`openspec validate --strict` checks a change's delta requirements, but a `MODIFIED` requirement that grows past 500 characters only fails after `openspec archive` has merged it into the main spec. That happened twice in M5 (`add-specfold-backlog`, `add-commitment-gate`): each time the archive had to be undone and the requirement split. A check in `specfold change check` (or the gate) could merge the deltas in memory and report the length before archive.

# Related

- [specfold change check](/capabilities/specfold-change-check.md)
- [OpenSpec 1.15](/references/openspec.md)
