---
type: Decision
title: Every install and upgrade path works from a private kit repo
description: Release downloads authenticate through gh or a token, so the kit works while its repo is private.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Updating the framework from user repos'"
---

# Decision

The release source is configurable in `specfold.yaml` (GitHub repo, HTTPS mirror or local path). Downloads use the user's `gh` login or `GITHUB_TOKEN`/`SPECFOLD_TOKEN`; nothing is written into the repo. The weekly upgrade workflow needs a read secret for the kit repo and is skipped without one.

# Why

The kit repo starts private, and M9 tests upgrades from a private source.

# Related

- [Delivery template bootstrap migrate](/decisions/delivery-template-bootstrap-migrate.md)
