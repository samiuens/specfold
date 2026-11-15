---
type: Decision
title: omp roles generated from the Claude Code agents
description: omp roles are generated from .claude/agents by agents sync, not hand-written, so each role keeps one source; planner is left out.
status: draft
decision: accepted
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:04:00+01:00 }
sources:
  - id: brief-add-omp-support
    resource: ../../openspec/changes/add-omp-support/brief.md
  - id: design-add-omp-support
    resource: ../../openspec/changes/add-omp-support/design.md
---

# Decision

omp skips `.claude/agents/` on purpose and reads roles only from `.omp/agents/`, in its own frontmatter dialect ([omp](/references/omp.md)). `specfold agents sync` therefore generates one `.omp/agents/<role>.md` per `.claude/agents/<role>.md`:
- `haiku`, `sonnet` and `opus` become `@smol`, `@default` and `@slow`;
- `effort` becomes `thinking-level` and `skills` becomes `autoload-skills`;
- tool names are mapped, and `disallowedTools: Agent` becomes `spawns: ""`.

The body is the source body behind one generated comment line, which marks the file as the sync's own.

`planner` is left out. omp subagents run headless and can't ask the user, so omp plans in the main session with `sf-plan`. Keys with no omp counterpart (`isolation`, `hooks`, `maxTurns`) are dropped, and their jobs moved: isolation goes to sf-apply's `isolated: true`, the no-push hook to the [omp hook adapter](/capabilities/specfold-hooks.md).

# Why

A second, hand-written copy of every role would drift from the Claude Code one, and CI would have to compare two dialects. Generation keeps one source, the same way `agents sync` already links skills instead of copying them ([skills symlinked for Claude](/decisions/skills-symlinked-for-claude.md)). The user chose this in the planning interview of `add-omp-support`.

# Rejected alternatives

- **Hand-written copies in `template/.omp/agents/`, checked by CI.** Two files per role to keep in step for every role change.

# Related

- [Marking generated omp roles with a frontmatter key](/decisions/omp-role-marker-in-frontmatter.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [Agent layer](/architecture/agent-layer.md)
