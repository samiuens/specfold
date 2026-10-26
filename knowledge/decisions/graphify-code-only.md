---
type: Decision
title: graphify is optional, code-only, and writes no instruction blocks
description: The kit recommends graphify for code navigation, in code-only mode, installed as a skill plus a Claude Code guard and never as an instruction block.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Token efficiency'"
---

# Decision

graphify stays optional; the gate never requires it. It runs with `GRAPHIFY_BACKEND=none` (and `graphify extract --code-only` for the first build), so nothing leaves the machine. It is installed with `graphify install --project --platform agents`, which writes only the skill. For Claude Code, Specfold registers graphify's PreToolUse guard (`graphify hook-guard`) in `.claude/settings.json`. `graphify claude install` and `graphify agents install` are not used. Refresh runs `graphify update .` from Specfold's post-checkout and post-merge hooks.

# Why

The semantic pass would send documents to an LLM and duplicate `knowledge/`. graphify's platform installers write their own `## graphify` section into `CLAUDE.md` or `AGENTS.md`, which would compete with the single lookup-order block in `AGENTS.md`.

# Rejected alternatives

- graphify's own installers plus a later merge by sf-migrate: two instruction blocks until someone cleans up.
- Skill only without the guard: weakest nudge toward the graph.

# Related

- [Graphify](/references/graphify.md)
