---
type: Reference
title: omp features Specfold relies on
description: How omp discovers skills, roles and hooks, its bash rules, task isolation and environment markers, as documented and checked against omp 18.20.2.
status: draft
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T21:01:48+01:00 }
stale_after: 2026-12-15T00:00:00+01:00
sources:
  - id: skills
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/skills.md
  - id: context-files
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/context-files.md
  - id: agents
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/task-agent-discovery.md
  - id: hooks
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/hooks.md
  - id: extensions
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md
  - id: settings
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/settings.md
  - id: approval
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/approval-mode.md
  - id: env
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/environment-variables.md
  - id: task
    resource: https://github.com/can1357/oh-my-pi/blob/main/docs/tools/task.md
---

# Summary

omp (oh-my-pi) is an agent harness. The facts below come from its docs and, where marked, from a spike against omp 18.20.2 on 2026-11-15: a headless `omp -p` run in a throwaway repository with a probe hook, plus a read of the bundled code.

- **Instructions.** omp loads `AGENTS.md` and `CLAUDE.md` by walking up from the working directory. At one directory depth, `AGENTS.md` shadows a standalone `CLAUDE.md`.[^context-files] Task subagents drop every file named `AGENTS.md`.
- **Skills.** omp reads `.agents/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md`. Copies with the same realpath (Specfold's symlinks) collapse into one. Same-named skills that differ keep the bare name for the higher-priority copy, and the other is listed as `agents/<name>`.[^skills]
- **Roles.** Task agents come from `.omp/agents/*.md` (project) and `~/.omp/agent/agents/*.md` (user); `.claude/agents/` is skipped on purpose.[^agents]
  - Frontmatter: `name` and `description` are required, plus `tools` (list or CSV), `spawns` (`""` denies spawning), `model` (a selector or role alias such as `@smol`, `@default`, `@slow`), `thinking-level` and `autoload-skills`.
  - A project agent named like a bundled one (`scout`, `task`, `reviewer`) overrides it.
- **Subagents.**
  - Subagents run headless, so a call that resolves to an approval prompt is rejected.[^approval]
  - `task.maxRecursionDepth` caps nesting (default 2).
  - Isolation is chosen per task with `isolated: true` and exists only when `task.isolation.enabled` is on.[^task]
  - With `task.isolation.merge: branch`, a task's work lands on branch `omp/task/<agent id>`. When the subagent committed in its workspace, that branch keeps its commits (spike, read from the bundled code). `task.isolation.apply: false` leaves the branch unapplied for the caller to merge.
- **Hooks.** Hooks are TS factories in `.omp/hooks/pre/*.ts` or `post/*.ts` that call `pi.on(event, handler)`.[^hooks] They load in every session, subagents included (spike).
  - `before_agent_start` returns `{message}` to inject context. It fires again before the run a blocked stop starts (spike).
  - `tool_call` returns `{block, reason}`.
  - `tool_result` returns `additionalContext`. The `write` input is `{path, content}` (spike).
  - `session_stop` fires for main sessions only and blocks with `{decision: "block", reason}` until a later stop is allowed.[^extensions] In the spike a block made the agent act on the reason, and the next stop went through.
  - Subagent marker: a subagent session's header has `parentSession`, read through `ctx.sessionManager.getHeader()`. `ctx.hasUI` is `false` for print-mode main sessions as well, so it does not tell them apart (spike).
- **Bash rules.** `bash.patterns` in `.omp/config.yml` is an ordered list of `{match, approval}` with `allow`, `prompt` or `deny`.[^settings]
  - The first match wins. `*` is the only wildcard, and whitespace runs are normalized.
  - `deny` and `prompt` also match single segments of compound commands.
  - Project rules are prepended to global ones and can tighten, never loosen, the operator's rules.
  - Spike: `git push *` denied `git push origin HEAD:refs/heads/x` but did not match a bare `git push`.
  - Shells started through the `eval` tool are outside these rules.
- **Environment.** omp's bash tool sets `PI_SESSION_ID`, `PI_SESSION_FILE` and `PI_TOOL_CALL_ID` on every agent command, and user `!` commands get none of them.[^env] The bundled shell environment also sets `OMPCODE=1` and `CLAUDECODE=1` (spike), so `CLAUDECODE` alone does not identify Claude Code.

[^context-files]: https://github.com/can1357/oh-my-pi/blob/main/docs/context-files.md
[^skills]: https://github.com/can1357/oh-my-pi/blob/main/docs/skills.md
[^agents]: https://github.com/can1357/oh-my-pi/blob/main/docs/task-agent-discovery.md
[^approval]: https://github.com/can1357/oh-my-pi/blob/main/docs/approval-mode.md
[^task]: https://github.com/can1357/oh-my-pi/blob/main/docs/tools/task.md
[^hooks]: https://github.com/can1357/oh-my-pi/blob/main/docs/hooks.md
[^extensions]: https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md
[^settings]: https://github.com/can1357/oh-my-pi/blob/main/docs/settings.md
[^env]: https://github.com/can1357/oh-my-pi/blob/main/docs/environment-variables.md

# Related

- [Claude Code features Specfold relies on](/references/claude-code.md)
- [opencode skills](/references/opencode.md)
- [Agent layer](/architecture/agent-layer.md)
