---
type: Capability
title: specfold new
description: Why concepts are created from templates, and where the contract for specfold new lives.
status: draft
change: 2026-10-26-add-specfold-new
resource: ../../openspec/specs/specfold-new/spec.md
spec: openspec/specs/specfold-new/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:38:53+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-new/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-new/design.md
---

# Why

Agents writing frontmatter by hand get small things wrong: a missing `status`, a timestamp without offset, an actor in the wrong shape. `specfold new` writes the profile's required fields from a per-type template, so the author (or the `sf-capture` skill in M3) only writes the body. It never writes a `human:` actor, because only humans verify ([humans verify only](/decisions/humans-verify-only.md)).

# Choices made while specifying and building

- Fields only the author can fill (`description`, a Decision's `sources`) start empty, so `specfold validate` fails until they are written; no placeholder text can pass as content.
- Without `--by`, the actor comes from `SPECFOLD_MODEL` and `actors.agent_prefix`, else `process:specfold-new`.
- A `Backlog Item` starts `open` with `priority: medium` and its writer as `origin`; a `Deferred Commitment` starts `open` with an empty `trigger`, and gets `committed_by` only when a human runs the command at a terminal (the guard and login of `specfold verify`). `sync` stubs never get `committed_by`.
- Template files in `.agents/skills/sf-capture/templates/` override the built-in bodies, so repos adapt templates without a CLI change.

This card was itself created with `specfold new`.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold validate](/capabilities/specfold-validate.md)
