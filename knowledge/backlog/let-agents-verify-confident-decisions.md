---
type: Backlog Item
title: Let agents verify confident decisions
description: A per-repository setting for whether an agent may verify a decision it is confident about, told apart from a human verify.
status: draft
state: open
priority: low
origin: human
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T08:50:23+01:00 }
---

# Idea

Today only humans verify concepts ([humans verify only](/decisions/humans-verify-only.md)). The user raised a setting for this in the review of the drifted concepts on 2026-10-29, when approving that decision: each repository decides whether verification stays with humans, or whether an agent may verify a decision it is confident about.

Open questions:

- the setting's shape in `specfold.yaml`, and whether it applies to every concept type or only some;
- what an agent's verify records: its own actor (`claude-code/<model>`), never a `human:` one;
- how `lookup`, `audit` and the trust flags tell an agent's verify from a human's, and what G7 checks.

# Related

- [Humans verify only](/decisions/humans-verify-only.md)
- [specfold verify](/capabilities/specfold-verify.md)
