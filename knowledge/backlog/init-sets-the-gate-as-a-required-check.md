---
type: Backlog Item
title: Init sets the gate as a required check
description: init and migrate install offer to make specfold-gate a required check on the default branch through a GitHub ruleset.
status: draft
state: open
priority: high
origin: human
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T08:50:23+01:00 }
---

# Idea

The kit's `main` requires `specfold-gate`, but a repository that installs Specfold only gets the workflow. The guides tell people to make the check required by hand, and until they do it only reports ([blocking merge gate](/decisions/blocking-merge-gate.md)). The user asked for this to be built in the review of the drifted concepts on 2026-10-29.

The idea: after asking the user, `init` and `migrate install` add `specfold-gate` as a required check on the default branch through a GitHub ruleset (`gh api`). Without the rights, they print the manual steps.

# Related

- [Blocking merge gate](/decisions/blocking-merge-gate.md)
- [specfold init](/capabilities/specfold-init.md)
- [specfold migrate](/capabilities/specfold-migrate.md)
