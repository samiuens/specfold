---
type: Capability
title: specfold agents sync
description: Why skills live once in .agents/skills and are linked into tool folders, and where the contract for agents sync lives.
status: draft
spec: openspec/specs/specfold-agents-sync/spec.md
resource: ../../openspec/specs/specfold-agents-sync/spec.md
change: 2026-11-15-add-omp-support
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:09:57+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-agents-sync
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-agents-sync/proposal.md
  - id: design-2026-10-26-add-specfold-agents-sync
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-agents-sync/design.md
  - id: proposal-2026-11-15-add-omp-support
    resource: ../../openspec/changes/archive/2026-11-15-add-omp-support/proposal.md
  - id: design-2026-11-15-add-omp-support
    resource: ../../openspec/changes/archive/2026-11-15-add-omp-support/design.md
---

# Why

Skills are written once, in `.agents/skills/`, which most agent tools read. Claude Code reads only `.claude/skills/` ([Claude Code](/references/claude-code.md)), and copies made by hand drift. `specfold agents sync` links every skill into the folders listed in `agents.targets`, so one source serves every tool.

# Choices made while specifying

- **Relative symlinks, committed.** Clones, worktrees and CI checkouts all resolve them, and there is never a second copy to drift.
- **Only its own links.** A symlink counts as its own when it resolves into `.agents/skills/`; only those are repointed or removed. Real folders (such as the `openspec-*` skills `openspec init` writes into `.claude/skills/`) and foreign links are kept and reported, so agents sync never fights another generator.
- **Compatible with the skills CLI.** The CLI behind skills.sh (`npx skills`) uses the same layout, one copy in `.agents/skills/` plus symlinks per agent, so links it creates count as own links here. Whether the upgrader uses it for skill updates is open ([skills CLI for skill updates](/backlog/skills-cli-for-skill-updates.md)).
- **Fail loudly.** When the file system refuses symlinks (for example Windows without symlink rights), the command stops with exit code 2. It never falls back to copies, which would bring back the drift.
- **omp roles come from the Claude Code agents.** When `tools` lists `omp`, the sync also writes one `.omp/agents/<role>.md` per `.claude/agents/<role>.md` except `planner`, mapped to omp's frontmatter. It also owns four `task` keys in `.omp/config.yml`: no nesting, isolation on, branch merges and no auto-apply. A role file counts as its own when its body starts with the generated comment; others are kept and reported. Without `omp`, own role files are removed ([omp roles generated from the Claude Code agents](/decisions/omp-roles-generated-from-claude-agents.md), change `add-omp-support`).
- **Lenient frontmatter for roles.** Claude Code accepts the shipped `verifier.md`, whose description holds an unquoted `: `, though that is not valid YAML. The generator falls back to reading such frontmatter line by line instead of refusing the file.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Deterministic CLI](/decisions/deterministic-cli.md)
