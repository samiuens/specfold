---
type: Backlog Item
title: Cost per change in stats
description: specfold stats reports the tokens a change cost, so each person can tune their subagent limit; needs the agent tool's local transcripts.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T09:19:45+01:00 }
---

# Idea

The plan wants `specfold stats` to report what a change cost in tokens, so each person can tune their subagent limit (`specfold parallel set`). The always-loaded set is measured since `add-specfold-stats`; the cost of a whole change is not.

# Why it waits

Real numbers live only in the agent tool's local session transcripts (for Claude Code under `~/.claude/projects/`), whose format is tool-specific, undocumented and private to each machine. Kept for M8 in M7's interview, then moved here in M8's interview (2026-10-28).

# Related

- [specfold stats](/capabilities/specfold-stats.md)
