---
type: Capability
title: specfold lookup
description: Why agents search knowledge by frontmatter first, and where the contract for specfold lookup lives.
status: draft
change: 2026-10-26-add-specfold-backlog
resource: ../../openspec/specs/specfold-lookup/spec.md
spec: openspec/specs/specfold-lookup/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:43:00+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-lookup/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-lookup/design.md
  - id: proposal-2026-10-26-add-specfold-drift
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-drift/proposal.md
  - id: design-2026-10-26-add-specfold-drift
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-drift/design.md
  - id: proposal-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/proposal.md
  - id: design-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/design.md
---

# Why

The cheapest answer to "why does this exist, what does it mean" is a path and one line from frontmatter, after which the agent reads one to three concepts. `specfold lookup` gives exactly that, ranked the same way every time, with each hit's trust tier (`deprecated`, `stale`, `unverified`) so agents read with care. It is the first step of the lookup order in `AGENTS.md` and the engine of the `sf-lookup` skill (M3).

# Choices made while specifying and building

- Only frontmatter is searched, never bodies, which keeps results short and cheap.
- Matching is by word prefix and every query word has to match; title counts most, then tags, then description and type.
- No hits is a valid answer (exit 0), not an error.
- After the results comes every vision and every open commitment that any query word matches, so planning always sees where the project is heading and what it has promised; the block ignores `--type` and `--limit` and never repeats a result.
- Results carry the `drift` flag when a file they describe changed after they were last written or verified; it is computed only for the printed results, so lookup stays fast ([specfold drift](/capabilities/specfold-drift.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold index](/capabilities/specfold-index.md)
