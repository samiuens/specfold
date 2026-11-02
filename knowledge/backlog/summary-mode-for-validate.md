---
type: Backlog Item
title: Summary mode for validate
description: A validate --summary flag that prints finding counts per rule and per folder instead of every finding.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T13:41:33+01:00 }
---

# Idea

`specfold validate --summary` prints finding counts per rule and per folder instead of every finding. On the first real migration's old bundle `validate` printed some 200 findings in hundreds of lines, and each conversion subagent had to grep the full output for its own files.

# Why it waits

Small and independent of the migration bug fixes. Moved here in the `fix-migration-findings` interview (2026-11-02).

# Related

- [specfold validate](/capabilities/specfold-validate.md)
