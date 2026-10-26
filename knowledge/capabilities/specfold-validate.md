---
type: Capability
title: specfold validate
description: Why the kit has its own OKF and profile validator, and where its contract lives.
status: draft
change: 2026-10-26-add-specfold-backlog
resource: ../../openspec/specs/specfold-validate/spec.md
spec: openspec/specs/specfold-validate/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T10:13:17+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-validate/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-validate/design.md
  - id: proposal-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/proposal.md
  - id: design-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/design.md
---

# Why

OKF ships no validator, and every agent, hook and CI job needs the same verdict on whether a bundle is well-formed. `specfold validate` is therefore the reference check for the kit: the three OKF conformance rules, the Specfold profile on top, and bundle-internal links. `--okf-only` keeps it useful for any OKF bundle, including bundles without `specfold.yaml`. See [Deterministic CLI](/decisions/deterministic-cli.md) and [OKF](/references/okf.md).

Rule ids are stable (`OKF-1` to `OKF-3`, `P1` to `P11`, `L1`, `L2`), so hooks, the gate (rule G1) and agents can react to specific findings.

# Choices made while specifying and building

- Warnings appear in human output only as a count; agents read them from `--json`.
- Broken links follow `gate.block_on_broken_links`, and `--okf-only` ignores them, because OKF requires consumers to tolerate broken links.
- Backlog items, deferred commitments and visions have their own key rules (P12-P14). A commitment without `committed_by` only warns, so an agent can draft a promise that a human then claims ([specfold commitments](/capabilities/specfold-commitments.md)).
- The upstream OKF sample fails one rule by design. See [acme_retail fixture](/decisions/acme-retail-patched-fixture.md).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Specs vs knowledge](/decisions/specs-vs-knowledge.md)
