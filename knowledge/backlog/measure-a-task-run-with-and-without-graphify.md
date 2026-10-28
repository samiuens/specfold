---
type: Backlog Item
title: Measure a task run with and without graphify
description: One recorded agent task run with and without graphify, preferably on a repository much larger than the sample app, to complete M7's before/after numbers.
status: draft
state: open
priority: medium
origin: implementation
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:10:48+01:00 }
---

# Idea

M7's done-when asks for before/after numbers on the sample app. `add-token-recipes` recorded the deterministic part (`specfold stats` before and after `graphify setup`, in the sample app's README), but the task run in Claude Code with and without graphify was skipped. The sample app has 164 lines of code, where graphify can save little; a larger repository would show the real effect.

Recorded when the run was skipped while applying `add-token-recipes` (2026-10-28).

# Related

- [Sample app agent check](/runbooks/sample-app-agent-check.md)
