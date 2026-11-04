---
type: Decision
title: Permission rules tracked in the manifest
description: "Rejected: tracking the rendered permission rules in the install manifest; the sync owns its fixed patterns instead."
status: draft
decision: rejected
change: 2026-11-04-add-agent-permissions
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-04T08:45:11+01:00 }
sources:
  - id: proposal-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/proposal.md
  - id: brief-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/brief.md
---

# Decision

Rejected: recording which permission rules `specfold permissions sync` wrote in `.specfold/manifest.json`, so the sync could tell its own rules from the team's. Decided by the maintainer on 2026-11-04 (brief question Q8 of change `add-agent-permissions`).

# Why

The patterns the sync generates are fixed strings from the kit's action table. Ownership is that set of patterns, plus the patterns earlier releases dropped (`retired`), so the sync needs no state to find its own rules ([agent permissions](/decisions/agent-permissions.md)). A manifest entry would add state that can drift from the settings file, would need a rule for every merge and upgrade, and gains nothing.

Worth reconsidering if users can write raw custom patterns in `specfold.yaml`: then the generated set is no longer known from the kit alone.

# Rejected alternatives

- Accepted instead: the sync owns exactly its current and retired patterns and never touches any other rule ([agent permissions](/decisions/agent-permissions.md)).

# Related

- [specfold permissions sync](/capabilities/specfold-permissions.md)
- [Upgrade file classes](/decisions/upgrade-file-classes.md)
