---
type: Decision
title: Tool-neutral first, Claude Code extras on top
description: The workflow runs on AGENTS.md, .agents/skills/, the CLI and CI; Claude Code hooks, subagents and skills are additions.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Agent layer'"
---

# Decision

Every step works with any agent that reads `AGENTS.md` and `.agents/skills/`. Claude Code gets hooks, subagent roles, native questions and plan approval on top, but nothing in the workflow depends on them.

# Why

Teams use several agents. Lock-in to one tool would cut the kit's reach, and the deterministic CLI and CI gate already carry everything that must be correct.

# Related

- [Skills symlinked for claude](/decisions/skills-symlinked-for-claude.md)
- [Deterministic cli](/decisions/deterministic-cli.md)
