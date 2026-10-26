---
type: Capability
title: Rename
description: Why to-do items can be renamed in place, and where the contract lives.
status: draft
spec: openspec/specs/rename/spec.md
resource: ../../openspec/specs/rename/spec.md
change: 2026-10-26-add-rename
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T18:58:24+01:00 }
sources:
  - id: proposal-2026-10-26-add-rename
    resource: ../../openspec/changes/archive/2026-10-26-add-rename/proposal.md
---

# Why

A typo in a title used to mean adding the item again, which lost its id and due date. `rename(id, title)` changes the title in place and keeps everything else, also for done items. It applies the same title rules as `add`, so a title is never empty, whichever way it was set.

The idea came from the backlog item [Rename an item](/backlog/rename-an-item.md), promoted with `specfold backlog promote`.

# Related

- [Due dates](/capabilities/due-dates.md)
