---
type: Backlog Item
title: Summary mode for validate
description: A validate --summary flag that prints finding counts per rule and per folder instead of every finding.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T09:55:31+01:00 }
---

# Idea

`specfold validate --summary` prints finding counts per rule and per folder instead of every finding. On Atrium's old bundle `validate` printed 214 findings in about 400 lines, and each conversion subagent had to grep the full output for its own files.

# Why it waits

Small and independent of the migration bug fixes. Moved here in the `fix-migration-findings` interview (2026-11-02).

# Related

- [specfold validate](/capabilities/specfold-validate.md)
