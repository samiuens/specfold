---
type: Component
title: Agent layer
description: The sf skills, the planner agent, and how skills reach each tool through .agents/skills and specfold agents sync.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:33:11+01:00 }
sources:
  - id: skills
    resource: ../../template/.agents/skills/sf-interview/SKILL.md
  - id: planner
    resource: ../../template/.claude/agents/planner.md
---

# Responsibility

The agent layer tells agents when to call the CLI and what to write around it. It never re-implements a check: every deterministic step is a `specfold` or `openspec` command ([deterministic CLI](/decisions/deterministic-cli.md)).

| Piece | Where | Job |
| --- | --- | --- |
| `sf-lookup` | skill | `specfold lookup`, read the 1-3 best concepts, report trust flags |
| `sf-capture` | skill | `specfold new`, write the body and sources, index, log, validate; rejected proposals become Decisions |
| `sf-sync` | skill | after archive: `specfold sync`, fill stubs, validate |
| `sf-audit` | skill | `specfold audit --json`, propose fixes; humans verify |
| `sf-interview` | skill | the planning interview: ground, design tree, native questions, never a timeout as consent, brief only after approval ([rather ask than assume](/decisions/rather-ask-than-assume.md)) |
| `sf-plan` | skill | the planner's steps for tools without agent definitions |
| `planner` | `.claude/agents/planner.md` | Claude Code main session in plan mode: interview, plan approval via `ExitPlanMode`, then the change artifacts |

# Interfaces

- **One source for skills.** Skills are written once in `.agents/skills/`, which opencode, Codex, Cursor and generic agents read. `specfold agents sync` links them into `.claude/skills/` for Claude Code ([specfold agents sync](/capabilities/specfold-agents-sync.md)). The shared frontmatter core is `name` equal to the folder name plus a `description` of at most 1024 characters ([opencode skills](/references/opencode.md)).
- **The planner runs as the main session,** because subagents never get `AskUserQuestion` ([Claude Code](/references/claude-code.md)). It is started with `claude --agent planner --permission-mode plan`. Until the M8 roles exist it has no subagents and writes the specs itself.
- **Shipping.** `template/` holds the canonical skills and planner. The kit runs byte-identical copies, which CI compares with the template ([self-hosting](/decisions/self-hosting.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold schema](/capabilities/specfold-schema.md)
