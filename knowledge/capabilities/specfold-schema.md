---
type: Capability
title: specfold schema
description: Why changes use the specfold OpenSpec schema with brief and knowledge artifacts, and where its contract lives.
status: draft
change: 2026-10-26-add-specfold-schema
resource: ../../openspec/specs/specfold-schema/spec.md
spec: openspec/specs/specfold-schema/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T12:51:50+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-schema
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-schema/proposal.md
---

# Why

OpenSpec's `spec-driven` schema has no artifact for the user's confirmed wish or for the knowledge a change creates, so both used to get lost ([custom OpenSpec schema](/decisions/custom-openspec-schema.md)). The `specfold` schema puts `brief` first and `knowledge` before `tasks`. Each of their templates has a shape that `specfold change check` can parse. The shipped `openspec/config.yaml` points every artifact at `knowledge/` and adds the knowledge and task rules.

# Choices made while specifying and building

- `template/openspec/schemas/specfold/` is canonical. The kit's own `openspec/schemas/specfold/` is a byte-identical copy, checked in CI, so the kit always runs the schema it ships.
- The instructions for `proposal`, `specs` and `design` stay word for word from upstream, so new OpenSpec releases merge by diff. Our own points go into `brief`, `knowledge`, `tasks` and the config `rules`.
- OpenSpec treats `requires` as advisory and never checks custom artifacts. Enforcement is therefore `specfold change check` plus the merge gate, not the schema ([OpenSpec 1.15](/references/openspec.md)).
- The tasks template carries the task breakdown ([task breakdown](/decisions/task-breakdown.md)) and a `Workflow follow-up` step for `specfold sync` ([write before, sync after](/decisions/write-knowledge-before-sync-after.md)).
- The design template ends with `## Commitments`: each open deferred commitment the change touches as a link with `: kept` or `: blocked: <reason>`, or `none`. The instruction stays upstream's; the template's comment and the config's `design` rule ask for the section, and gate rule G17 reads it ([specfold commitments](/capabilities/specfold-commitments.md)).
- Changes pin their schema in `.openspec.yaml`, so changes proposed before the switch stay on `spec-driven` until they are moved over by hand.

# Related

- [Rather ask than assume](/decisions/rather-ask-than-assume.md)
- [Self-hosting](/decisions/self-hosting.md)
