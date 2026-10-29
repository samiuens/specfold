---
type: Decision
title: Claude Code skills are symlinks into .agents/skills/
description: specfold agents sync links each .agents/skills/<name> into .claude/skills/ instead of copying it.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T11:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Agent layer'"
---

# Decision

`.agents/skills/` stays the canonical location. Because Claude Code does not read it, `specfold agents sync` creates one symlink per skill in `.claude/skills/` (and in other tool folders listed in config). OpenSpec's own skills arrive there as real folders from `openspec init --tools claude`; `agents sync` keeps any entry that is not its link.

# Why

Claude Code officially supports symlinked skill folders and loads a skill once even if several locations point at it. Symlinks cannot drift, so no copy check is needed.

# Rejected alternatives

- Copies: can drift and need a gate check.
- Symlinks with copy fallback: more code for a case nobody has asked for yet.

# Related

- [Claude code](/references/claude-code.md)
- [Tool neutral first](/decisions/tool-neutral-first.md)
