---
type: Reference
title: Claude Code features Specfold relies on
description: Skills, hooks, question tool, subagents, plan mode, worktrees and permission rules in Claude Code, as documented on 2026-10-26 and 2026-11-04.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-04T08:34:50+01:00 }
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
  - id: permissions
    resource: https://code.claude.com/docs/en/permissions.md
---

# Skills and instructions

- Skills load from `.claude/skills/` (project, personal, enterprise, nested, plugins), not from `.agents/skills/`. A skill entry can be a symlink to a folder elsewhere; it loads once even if several locations point at it.[^skills]
- All `SKILL.md` frontmatter fields are optional (`name` defaults to the folder name; `description` is recommended). `description` plus `when_to_use` is cut off at 1,536 characters in the skill listing. Supporting files such as `references/` load when `SKILL.md` links them. Outside Claude Code (claude.ai, the Skills API) only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` are accepted.
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
- `claude --agent <name>` runs the main session with the agent's prompt, tools and model; a non-empty agent prompt replaces the default system prompt, and `CLAUDE.md` still loads. `"agent": "<name>"` in `.claude/settings.json` makes it the project default. `permissionMode` is documented only for subagents, so Specfold starts the planner with `--permission-mode plan` as well (checked 2026-10-26).
- `AskUserQuestion` is always removed from subagents, even when listed in `tools`; `ExitPlanMode` is removed unless the subagent's `permissionMode` is `plan`. That is why the planner runs as the main session.
- Approving `ExitPlanMode` switches to auto mode or manual-approve (default) mode, chosen by the user.[^modes]

# Worktrees and limits

- `claude --worktree <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. `worktree.baseRef` is `fresh` (default, remote default branch) or `head`. `.worktreeinclude` (gitignore syntax) copies ignored files into new worktrees. Subagent worktrees without changes are removed automatically.[^worktrees]
- `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20) and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3) exist.[^env]

# Permissions

Checked against the permissions page on 2026-11-04.[^permissions]

- Rules are evaluated deny, then ask, then allow; the first match in that order decides, and specificity does not change it. An allow rule can't carve an exception out of a matching ask or deny rule. Deny and ask rules from any settings scope beat allow rules from any other scope.
- Project `permissions.allow` rules apply only after the user accepts the workspace trust dialog; `ask` and `deny` rules apply right away.
- Bash rules match the whole command text. `*` matches any text, spaces included, and can stand at the start, in the middle or at the end. Everything before the first `*` is matched as written. A trailing ` *` (space, then the rule's only `*`) also matches the bare command, so `Bash(git push *)` matches `git push`; the space is part of the rule, so `Bash(ls *)` misses `lsof`.
- `:*` is an equivalent trailing wildcard (`Bash(ls:*)` = `Bash(ls *)`), recognized only at the end of a rule. The permission dialog writes the space form. A rule that has to end in a literal `:` followed by anything can't be written.
- Claude Code warns at startup about an allow rule with a `*` before the subcommand, such as `Bash(git * main)`.
- Compound commands are split at `&&`, `||`, `;`, `|`, `|&`, `&` and newlines. Deny and ask rules apply when any subcommand matches, also inside subshells, command substitutions and loops, in every mode. Deny and ask rules also match past any leading variable assignment.
- Bash rules match only the form Claude writes: `Bash(git push *)` misses `git -C . push`, `git -c x=y push` and `git 'push'`. The docs call argument-constraining patterns fragile and point at sandboxing or PreToolUse hooks for hard boundaries.
- `Bash(command:...)` parameter rules are ignored with a startup warning; use `Bash(<command> *)`.
- `Read(./path/**)` deny rules cover file tools and recognized Bash file commands, not `grep -r`.
