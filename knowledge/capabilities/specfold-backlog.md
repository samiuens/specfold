---
type: Capability
title: specfold backlog
description: Why backlog items have their own commands, and how promoting one hands the idea to the planning interview.
status: draft
spec: openspec/specs/specfold-backlog/spec.md
resource: ../../openspec/specs/specfold-backlog/spec.md
change: 2026-10-26-add-specfold-backlog
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T18:21:12+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/proposal.md
  - id: design-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/design.md
---

# Why

Ideas that are needed later but not now used to live in chat logs and issue lists that agents never see. As backlog items in `knowledge/backlog/` they sit next to the rest of the project's knowledge ([vision](/vision/specfold.md)), and `specfold backlog` gives them a life cycle: add, list, promote to a change, or drop with a reason.

# Choices made while specifying and building

- **Items are ordinary concepts.** A `Backlog Item` carries `state` (`open`, `promoted`, `dropped`), `priority` and `origin` (interview, retro, a change id, human); validate's P12 checks them, and a promoted item names its `change`, a dropped one its `reason`.
- **Promotion seeds the interview, it doesn't replace it.** `backlog promote` creates the change folder with `openspec new change` and marks the item, but writes no brief: the planning interview still asks every open decision and writes the brief after the user approves ([rather ask than assume](/decisions/rather-ask-than-assume.md)).
- **Origin is honest.** Without `--origin`, an item's origin is the actor that wrote it, never `human`; without `--description`, the description is the title, so a new item passes validation at once.
- **Neglect shows up.** Audit's A8 reports an open item no commit has touched for `audit.backlog_untouched_days` (default 180), so the backlog is either worked on, promoted or dropped.

# Related

- [specfold commitments](/capabilities/specfold-commitments.md)
- [specfold audit](/capabilities/specfold-audit.md)
- [specfold CLI](/architecture/specfold-cli.md)
