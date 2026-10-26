---
type: Capability
title: specfold commitments
description: Why anyone may fulfill a deferred commitment but only a human may withdraw one, and where the contract lives.
status: draft
spec: openspec/specs/specfold-commitments/spec.md
resource: ../../openspec/specs/specfold-commitments/spec.md
change: 2026-10-26-add-specfold-backlog
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T18:21:12+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/proposal.md
  - id: design-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/design.md
---

# Why

A deferred commitment is a promise the project made for later, such as "keep checkout EU-hostable" or "add SSO before 1.0". Unlike a backlog item it may not quietly disappear: it ends either fulfilled or withdrawn by a human with a reason ([vision](/vision/specfold.md)). `specfold commitments` lists the promises by due date and moves them to one of those two ends.

# Choices made while specifying and building

- **Due dates come from the trigger.** A `trigger` that is a date (`2027-01-31`) or timestamp is a due date; a condition (`before 1.0`) never is. The list sorts dated promises first, audit's A6 reports overdue ones, and the session-start hook counts those due within 30 days.
- **Agents draft, humans commit.** An agent may write a commitment without `committed_by`, which validate's P13 only warns about; `specfold new` writes `committed_by: human:<login>` only for a person at a terminal, and the gate checks that login against the PR ([humans verify only](/decisions/humans-verify-only.md)).
- **Fulfilling is routine, withdrawing is not.** Anyone may record that a change kept a promise (`fulfill --change`). `withdraw --reason` refuses agents with the same guard as `specfold verify` and adds the person's `verified` entry, leaving `status` alone, so the withdrawal itself carries a human signature.
- **Every promise serves a goal.** Audit's A7 reports an open commitment without a `vision` link.

# Related

- [specfold backlog](/capabilities/specfold-backlog.md)
- [specfold verify](/capabilities/specfold-verify.md)
- [specfold CLI](/architecture/specfold-cli.md)
