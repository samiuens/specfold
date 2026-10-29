---
type: Backlog Item
title: Agent permissions in specfold.yaml
description: Declare what agents may do on their own (push, open PRs, close PRs, delete branches) in Specfold and render it into each tool's permission settings.
status: draft
state: open
priority: medium
origin: human
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T17:43:22+01:00 }
---

# Idea

A project declares once, in `specfold.yaml`, which outward-facing or hard-to-undo actions an agent may take on its own and which need the user's go-ahead first: for example push, open or close a PR, delete a remote branch, force-push, publish a release. Specfold renders that into each agent tool's own permission settings (in Claude Code the `allow`, `ask` and `deny` rules in `.claude/settings.json`) and states the same rule in `AGENTS.md` for tools without a permission system.

On 2026-10-29 an agent pushed a branch and opened a PR after finishing the brand kit, because `AGENTS.md` says each feature ends with a PR. The user wanted to review first. Undoing it (closing the PR and deleting the remote branch) was then blocked by the tool's own permission check until the user approved it. A declared rule would have made the agent ask before pushing.

# Why it waits

Each agent tool has its own permission format and coverage, so this needs a survey of the supported tools first. It overlaps with [read barriers for other agents](/backlog/read-barriers-for-other-agents.md), which renders a deny list per tool, and may share its renderer.

# Related

- [Read barriers for other agents](/backlog/read-barriers-for-other-agents.md)
- [Claude Code](/references/claude-code.md)
- [Rather ask than assume](/decisions/rather-ask-than-assume.md)
