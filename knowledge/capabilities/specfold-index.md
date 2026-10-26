---
type: Capability
title: specfold index
description: Why bundle indexes are generated instead of written, and where the contract for specfold index lives.
status: draft
change: 2026-10-26-add-specfold-index
resource: ../../openspec/specs/specfold-index/spec.md
spec: openspec/specs/specfold-index/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T10:28:56+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-index/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-index/design.md
---

# Why

Indexes are the entry point of every lookup: an agent reads `index.md`, picks one to three concepts and stops. Hand-written indexes drift from the files they list and cost agents tokens to maintain. `specfold index` builds them deterministically from frontmatter, so `--check` can run in CI (gate rule G2) and indexes never need a manual merge. See [Deterministic CLI](/decisions/deterministic-cli.md).

Indexes also connect code and knowledge: `see knowledge:` comments in files matching `source_globs` show up under the concept they cite, as described in [code comments point to knowledge](/decisions/code-comments-point-to-knowledge.md).

# Choices made while specifying

- Folder titles and descriptions live in `specfold.yaml` under `folders`, because folder indexes may not carry frontmatter in OKF.
- Deprecated concepts stay listed and marked, so agents see them but know not to rely on them.
- A reference to a missing concept only warns here; blocking is gate rule G14.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold validate](/capabilities/specfold-validate.md)
