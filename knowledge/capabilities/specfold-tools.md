---
type: Capability
title: specfold tools setting
description: Why repositories list their agent tools in specfold.yaml, and how the CLI signs agent writes made under omp; links the new spec.
status: draft
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:04:00+01:00 }
sources:
  - id: brief-add-omp-support
    resource: ../../openspec/changes/add-omp-support/brief.md
  - id: proposal-add-omp-support
    resource: ../../openspec/changes/add-omp-support/proposal.md
  - id: design-add-omp-support
    resource: ../../openspec/changes/add-omp-support/design.md
---

# Why

Before omp, the only agent-specific setup was Claude Code's, and whether a repository had it could be read off the manifest (its `.claude/` files) or `agents.targets`. omp support is opt-in and has no file of its own to read that off, so `tools` in `specfold.yaml` says which tools a repository is set up for: `agents` (always), `claude` and `omp`. `init --tools` and `migrate install --tools` write it, and agents sync, permissions sync and upgrade read it ([omp](/references/omp.md)).

# Choices made while specifying and building

- **The ids `--tools` already used.** `agents` and `claude` are OpenSpec's own tool ids, so the setting reuses them and adds `omp`. `omp` is never passed to `openspec init`, which has no such tool; omp reads `.agents/skills/` directly.
- **No key reads as before.** Without `tools`, the setting is `[agents, claude]` when `agents.targets` has `.claude/skills`, else `[agents]`, so repositories from earlier releases behave exactly as they did. The upgrader keeps its manifest rule for them ([omp tools from the manifest](/decisions/omp-tools-from-manifest.md)).
- **The signature follows the tool, not the setting.** One repository can be used from Claude Code and omp, so a single `actors.agent_prefix` would sign half the writes wrongly. The CLI signs `omp/<model>` when `OMPCODE` or `PI_SESSION_ID` is set and not empty, and uses `agent_prefix` otherwise. omp's shell also sets `CLAUDECODE`, so that variable alone never means Claude Code. `verify` refuses under the same variables.
- **Tests run outside omp's environment.** The kit's vitest config clears `OMPCODE` and `PI_SESSION_ID`, because tests that expect `claude-code/` or a human at the keyboard failed when vitest ran inside an omp session.

# Related

- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [specfold permissions sync](/capabilities/specfold-permissions.md)
- [Tool-neutral first, Claude Code extras on top](/decisions/tool-neutral-first.md)
