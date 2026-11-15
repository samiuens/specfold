---
type: Backlog Item
title: Duplicate openspec skills in two folders
description: "openspec init writes differing real copies of the openspec-* skills into .agents/skills and .claude/skills, so omp lists each twice."
status: draft
state: open
priority: low
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-15T20:48:21+01:00 }
sources: []
---

# Idea

`openspec init --tools agents,claude` writes the `openspec-*` skills as real folders into both `.agents/skills/` and `.claude/skills/`, and the two copies differ. omp reads both folders, keeps the higher-priority copy under its bare name and lists the other as `agents/openspec-*`, so every OpenSpec skill shows up twice. `specfold agents sync` keeps real folders on purpose ([specfold agents sync](/capabilities/specfold-agents-sync.md)), so the fix lies in how init calls OpenSpec or in an omp skill setting.

Left out of `add-omp-support` in its planning interview.

# Related

- [Agent layer](/architecture/agent-layer.md)
