---
type: Capability
title: specfold profile
description: Why a repository can choose a full or a knowledge-only Specfold setup, and where the profile contract lives.
status: draft
spec: openspec/specs/specfold-profile/spec.md
resource: ../../openspec/specs/specfold-profile/spec.md
change: 2026-11-09-add-knowledge-profile
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T08:59:48+01:00 }
sources:
  - id: brief-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/brief.md
  - id: proposal-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/proposal.md
  - id: design-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/design.md
---

# Why

Some repositories want Specfold's knowledge side without OpenSpec: an infrastructure monorepo such as iac keeps a rich OKF bundle but has no behavior to pin down in specs. The `profile` key in `specfold.yaml` lets such a repository adopt the knowledge tooling, gate and skills now and move to the full workflow later ([a knowledge-only profile](/decisions/knowledge-profile.md)). The contract lives in `openspec/specs/specfold-profile/spec.md`, created when the change `add-knowledge-profile` is archived.

# Choices made while specifying and building

- **Two values, default `full`.** A missing key behaves as `full`, so existing repositories keep their installs byte for byte. `profile_version` stays the format version and is independent of the profile ([versioning](/decisions/versioning.md)).
- **One filter decides the file set.** `kitOwned` in `tools/specfold/src/migrate/install.ts` takes the profile and drops the OpenSpec schema, `sf-plan`, `sf-apply`, `sf-sync` and every Claude Code subagent except `scout`. Install, upgrade and init's removal step share it ([upgrade file classes](/decisions/upgrade-file-classes.md)).
- **Block variants live in the template.** `template/.specfold/profiles/knowledge/` holds the knowledge text for the managed blocks of `AGENTS.md`, `CLAUDE.md` and the pull request template ([managed blocks](/decisions/managed-blocks.md)). The folder is kit-owned in both profiles, so a full install gains those files too; "full install unchanged" is read as "the profile filter drops nothing for full".
- **Leftover hashes for unmanaged template files.** The shipped manifest has no hash for `openspec/config.yaml`, which is merged and not kit-owned, so `.specfold/profiles/knowledge/leftovers.json` records the hashes of such files. A file snapshot test keeps it current. Init uses it to tell an unchanged template copy from an edited one.
- **Escape label.** A knowledge install that creates `specfold.yaml` sets `gate.escape_label` to `no-knowledge`; an existing value stays.
- **Unknown values stop early.** `loadConfig` throws a usage error, so every command validates the key the same way, and doctor's D2 reports it instead of throwing ([specfold doctor](/capabilities/specfold-doctor.md)).
- **Where each command reads the profile.** [init](/capabilities/specfold-init.md) and [migrate](/capabilities/specfold-migrate.md) install the set, [upgrade](/capabilities/specfold-upgrade.md) keeps it and records it in the manifest, and the [gate](/capabilities/specfold-gate.md) picks its rules by it.

# Related

- [A knowledge-only profile](/decisions/knowledge-profile.md)
- [One template payload per profile](/decisions/template-payload-per-profile.md)
- [Agent layer](/architecture/agent-layer.md)
