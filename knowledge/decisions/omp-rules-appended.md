---
type: Decision
title: Specfold's omp bash rules appended
description: "Rejected: appending Specfold's omp bash rules; omp applies the first match, so the owned block goes first, strictest level first."
status: draft
decision: rejected
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:04:00+01:00 }
sources:
  - id: design-add-omp-support
    resource: ../../openspec/changes/add-omp-support/design.md
---

# Decision

Rejected: appending the rules `permissions sync` renders to the end of `bash.patterns` in `.omp/config.yml`, as it does for Claude Code's lists.

The sync instead keeps its rules as one block at the start of `bash.patterns`: deny first, then prompt, then allow, each in the order of the action table. Every other entry follows in its own order.

# Why

Claude Code checks deny, then ask, then allow whatever the order inside a list ([agent permissions](/decisions/agent-permissions.md)). omp applies the first rule that matches ([omp](/references/omp.md)). Appended, a team's earlier `allow` rule would shadow Specfold's `prompt` for `git push`. Leading with the strictest level also keeps the sub-action invariant: with `push: allow` and `force-push: deny`, `git push --force` meets `deny` first.

# Related

- [specfold permissions sync](/capabilities/specfold-permissions.md)
