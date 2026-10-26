---
type: Decision
title: Delivered as template repo, bootstrap prompt and migration skill
description: One kit repo ships a template for new projects, a paste-able bootstrap prompt and a migration skill for existing ones.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Deliverables'"
---

# Decision

New projects start from the template repo and run `specfold init`. Repos without the kit paste `BOOTSTRAP.md` into any agent, which downloads a pinned release and runs `sf-migrate`. Both install from the same release tarball of `template/`.

# Why

The kit has to reach new and existing codebases alike, and every path should install the same files from one source.

# Related

- [Migration on own branch](/decisions/migration-on-own-branch.md)
- [Private kit repo](/decisions/private-kit-repo.md)
