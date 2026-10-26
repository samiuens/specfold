---
type: Capability
title: specfold agents sync
description: Why skills live once in .agents/skills and are linked into tool folders, and where the contract for agents sync lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:09:57+01:00 }
---

# Why

Skills are written once, in `.agents/skills/`, which most agent tools read. Claude Code reads only `.claude/skills/` ([Claude Code](/references/claude-code.md)), and copies made by hand drift. `specfold agents sync` links every skill into the folders listed in `agents.targets`, so one source serves every tool.

# Choices made while specifying

- **Relative symlinks, committed.** Clones, worktrees and CI checkouts all resolve them, and there is never a second copy to drift.
- **Only its own links.** A symlink counts as its own when it resolves into `.agents/skills/`; only those are repointed or removed. Real folders (such as the `openspec-*` skills `openspec init` writes into `.claude/skills/`) and foreign links are kept and reported, so agents sync never fights another generator.
- **Compatible with the skills CLI.** The CLI behind skills.sh (`npx skills`) uses the same layout, one copy in `.agents/skills/` plus symlinks per agent, so links it creates count as own links here. Whether the upgrader uses it for skill updates is open ([skills CLI for skill updates](/backlog/skills-cli-for-skill-updates.md)).
- **Fail loudly.** When the file system refuses symlinks (for example Windows without symlink rights), the command stops with exit code 2. It never falls back to copies, which would bring back the drift.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Deterministic CLI](/decisions/deterministic-cli.md)
