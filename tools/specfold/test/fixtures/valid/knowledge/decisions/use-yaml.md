---
type: Decision
title: Use YAML frontmatter
description: Concepts carry their metadata as YAML frontmatter.
status: stable
decision: accepted
generated: { by: claude-code/test-model, at: 2026-10-20T10:00:00+02:00 }
verified:
  - { by: human:ada, at: 2026-10-21T09:00:00Z }
sources:
  - id: notes
    resource: ../../docs/notes.md
owner_team: platform
---

# Decision

Metadata lives in frontmatter, as described in the [OKF summary](/references/okf.md) and the [runbook](../runbooks/rotate-keys.md#steps).

Code may say `MUST` inside backticks.

```text
The service MUST retry.
```
