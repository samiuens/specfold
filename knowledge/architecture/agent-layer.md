---
type: Component
title: Agent layer
description: The sf skills, the planner agent, and how skills reach each tool through .agents/skills and specfold agents sync.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T16:02:15+01:00 }
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

# Instructions and shipping

- **`AGENTS.md`** (template) holds what every agent needs in every session, in under 60 lines and with no volatile text:
  - rather ask than assume;
  - a map of the repo;
  - the core rule;
  - the lookup order;
  - the workflow with the commands per tool;
  - when OpenSpec is not needed;
  - the knowledge rules, which name the code-comment convention.

  `CLAUDE.md` imports it with `@AGENTS.md` and adds the planner start command, the slash commands and the skills folder ([Claude Code](/references/claude-code.md)).
- **The CLI travels with the template** as `scripts/specfold.mjs`, a copy of the kit's bundle, so every command in the instructions runs without an install. OpenSpec is the one external tool; `specfold doctor` checks its version.
- **Proven on 2026-10-26:**
  - **Claude Code:** on a fresh copy of the sample app, outside the kit so the kit's own instructions don't load, the planner interviewed with native questions, took a correction through plan approval, and wrote `add-priorities`, which passes `change check` ([agent check runbook](/runbooks/sample-app-agent-check.md)).
  - **opencode:** it loaded the sf skills from `.agents/skills/` and answered a lookup through `sf-lookup`.
- **Found in that run:** the planner first took the user's login for `confirmed_by` from an earlier brief, and Claude Code's safety check refused to write an approval the user had not stated. The planner, `sf-interview` and `sf-plan` now ask the user to state their login when approving ([rather ask than assume](/decisions/rather-ask-than-assume.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold schema](/capabilities/specfold-schema.md)
