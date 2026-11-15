---
type: Backlog Item
title: Init without Claude Code in older settings files
description: "init --tools without claude still sets up .claude/ files when specfold.yaml predates the agents: key, since there is no targets line to clear."
status: draft
state: open
priority: low
origin: verify
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:18:35+01:00 }
sources:
  - id: omp-run
    resource: ../../examples/runs/omp/README.md
    title: "omp run, section 'Findings'"
---

# Idea

`specfold init --tools` without `claude` empties `agents.targets` by editing the `targets:` line in `specfold.yaml`. A `specfold.yaml` from before that key existed (the sample app's, from kit 0.2.1) has no such line, so `agents.targets` keeps its default `.claude/skills`. Init then links the OpenSpec skills into `.claude/skills/` and writes `.claude/settings.json` anyway. `--tools agents` behaved the same before omp support. A repository made from the current template has the key and is not affected.

A fix could add `agents:` with `targets: []` when the key is missing. The same edit would also matter for `migrate install` on a repository that keeps an older `specfold.yaml`.

Found in the omp run of `add-omp-support`.

# Related

- [specfold init](/capabilities/specfold-init.md)
- [specfold tools setting](/capabilities/specfold-tools.md)
