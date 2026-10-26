---
type: Decision
title: Kit knowledge at the root, payload in template/
description: The kit repo keeps its own knowledge, specs and settings at the root; everything shipped to user repos lives in template/.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Dogfooding: the kit repo uses the kit'"
---

# Decision

The root holds `knowledge/`, `openspec/`, `AGENTS.md`, `CLAUDE.md` and `specfold.yaml` for the kit itself. `template/` holds the payload with an empty bundle. The release job publishes `template/` as a tarball and syncs it to a separate template repo.

# Why

"Use this template", `BOOTSTRAP.md` and `sf-migrate` must never copy the kit's own knowledge into a user repo, while the kit still runs its own workflow on real files.

# Related

- [Self hosting](/decisions/self-hosting.md)
