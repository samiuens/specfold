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

Until the first release (v0.1.0), `BOOTSTRAP.md` pins a full commit sha of the kit and fetches its tarball through the user's `gh` login, which works while the kit repo is private ([private kit repo](/decisions/private-kit-repo.md)); the pin moves in its own PR after each template change ([runbook](/runbooks/move-bootstrap-pin.md)). The template carries `.specfold/manifest.json`, so a repository made from it knows what came from the kit just like a migrated one.

# Why

The kit has to reach new and existing codebases alike, and every path should install the same files from one source.

# Related

- [Migration on own branch](/decisions/migration-on-own-branch.md)
- [Private kit repo](/decisions/private-kit-repo.md)
- [specfold init](/capabilities/specfold-init.md)
