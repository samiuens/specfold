---
type: Reference
title: Claude Code features Specfold relies on
description: Skill locations, hooks, question tool, subagent frontmatter, plan mode and worktree settings in Claude Code, as documented on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: skills
    resource: https://code.claude.com/docs/en/skills.md
  - id: hooks
    resource: https://code.claude.com/docs/en/hooks.md
  - id: tools
    resource: https://code.claude.com/docs/en/tools-reference.md
  - id: subagents
    resource: https://code.claude.com/docs/en/sub-agents.md
  - id: memory
    resource: https://code.claude.com/docs/en/memory.md
  - id: modes
    resource: https://code.claude.com/docs/en/permission-modes.md
  - id: worktrees
    resource: https://code.claude.com/docs/en/worktrees.md
  - id: env
    resource: https://code.claude.com/docs/en/env-vars.md
---

# Skills and instructions

- Skills load from `.claude/skills/` (project, personal, enterprise, nested, plugins), not from `.agents/skills/`. A skill entry can be a symlink to a folder elsewhere; it loads once even if several locations point at it.[^skills]
- `AGENTS.md` is read natively only when no `CLAUDE.md` or `CLAUDE.local.md` exists; `@AGENTS.md` in `CLAUDE.md` loads both. `.agents/` is never read as instructions.[^memory]

# Hooks

- Events include `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `WorktreeCreate` and others (33 in total).[^hooks]
- `SessionStart`: plain stdout is added to context.
- `PostToolUse`: exit 2 shows stderr to Claude; the tool has already run.
- `Stop`: exit 2, or JSON `decision: "block"` with a `reason`, keeps Claude working. After 8 consecutive blocks the next one is overridden (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).
- Hook output to context is capped at 10,000 characters; longer output is saved to a file with a 2,000-character preview.

# Questions

- `AskUserQuestion`: 1-4 questions per call, 2-4 options each, header up to 12 characters, optional `multiSelect`, an automatic "Other" for free text.[^tools]
- `askUserQuestionTimeout` (`60s`, `5m`, `10m`; off by default) closes a question and tells Claude the user may be away, so it continues on its own judgment. It does not apply to plan approval.

# Subagents and plan mode

- Frontmatter in `.claude/agents/*.md`: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation` (`worktree`), `color`, `initialPrompt` and others. Unknown keys are silently ignored.[^subagents]
- `claude --agent <name>` runs the main session with the agent's prompt, tools and model. `permissionMode` is documented only for subagents; whether it applies under `--agent` is untested.
- Approving `ExitPlanMode` switches to auto mode or manual-approve (default) mode, chosen by the user.[^modes]

# Worktrees and limits

- `claude --worktree <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. `worktree.baseRef` is `fresh` (default, remote default branch) or `head`. `.worktreeinclude` (gitignore syntax) copies ignored files into new worktrees. Subagent worktrees without changes are removed automatically.[^worktrees]
- `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20) and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3) exist.[^env]
- Permission deny rules use `Read(./path/**)`; they cover file tools and recognized Bash file commands, not `grep -r`.
