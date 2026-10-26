---
type: Capability
title: specfold change check
description: Why change check is the enforcement of brief.md and knowledge.md, and where its contract lives.
status: draft
change: 2026-10-26-add-specfold-change-check
resource: ../../openspec/specs/specfold-change-check/spec.md
spec: openspec/specs/specfold-change-check/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:12:39+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-change-check
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-change-check/proposal.md
  - id: design-2026-10-26-add-specfold-change-check
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-change-check/design.md
---

# Why

OpenSpec treats `requires` as advisory and never looks at custom artifacts, so on its own nothing stops a change from being archived without a confirmed brief or a knowledge delta ([OpenSpec 1.15](/references/openspec.md)). `specfold change check` is that missing enforcement. It gives one deterministic verdict on `brief.md`, `knowledge.md` and `tasks.md`, which hooks, the merge gate (G5, G13) and `specfold sync` all share ([custom OpenSpec schema](/decisions/custom-openspec-schema.md)).

# Choices made while specifying

- **Shape, not identity.** `confirmed_by` must be a `human:<login>` actor. Whether that login really approved the brief is checked by the gate against GitHub reviews (G7), because a local tool cannot know ([humans verify only](/decisions/humans-verify-only.md)).
- **Brief fields:** an open question needs `(owner: …)` and a reason it does not block the spec; a decision names its source (`user`, `delegated` or an existing concept). Unanswered questions and unsourced decisions therefore cannot hide in the brief ([rather ask than assume](/decisions/rather-ask-than-assume.md)).
- **Capability coverage goes by path,** `capabilities/<cap>.md`, which matches the cards that already exist.
- **`create` may name an existing file of the same type,** because the Knowledge task group writes concepts before archive ([write before, sync after](/decisions/write-knowledge-before-sync-after.md)).
- **Template placeholders count as empty,** because HTML comments are removed before checking. An untouched template therefore never passes.
- **The knowledge rules take an `archived` option,** so `specfold sync` re-checks an archived change with the same code.

# Related

- [specfold tasks](/capabilities/specfold-tasks.md)
- [specfold schema](/capabilities/specfold-schema.md)
- [specfold CLI](/architecture/specfold-cli.md)
