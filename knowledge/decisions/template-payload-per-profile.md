---
type: Decision
title: One template payload per profile
description: "Rejected: shipping one template payload per profile; it doubles release assets and upgrade fixtures for a small file split."
status: draft
decision: rejected
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T08:59:49+01:00 }
sources:
  - id: brief-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/brief.md
  - id: proposal-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/proposal.md
  - id: design-add-knowledge-profile
    resource: ../../openspec/changes/add-knowledge-profile/design.md
---

# Decision

Rejected: shipping one template payload per profile (a full template and a knowledge template, each with its own release asset), as an alternative to one template that init, migrate and upgrade filter by profile. Considered while designing `add-knowledge-profile` (design decision D1) and not taken.

# Why

Every release asset and every upgrade fixture would double for a small split: the knowledge profile differs by a handful of skills, subagents, the OpenSpec schema and three block variants. One template plus a shared filter keeps a single payload and a single manifest ([a knowledge-only profile](/decisions/knowledge-profile.md)).

Worth reconsidering if the profiles drift far apart, for example a third profile that shares little of the template.

# Rejected alternatives

- **Per-file profile tags in the manifest:** also rejected, as more moving parts for a two-value split.

# Related

- [specfold profile](/capabilities/specfold-profile.md)
- [Upgrade file classes](/decisions/upgrade-file-classes.md)
