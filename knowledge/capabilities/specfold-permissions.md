---
type: Capability
title: specfold permissions sync
description: Why permissions sync exists, its owned patterns per action, the push sub-action rule and where its contract lives.
status: draft
spec: openspec/specs/specfold-permissions/spec.md
resource: ../../openspec/specs/specfold-permissions/spec.md
change: 2026-11-04-add-agent-permissions
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-04T08:44:28+01:00 }
sources:
  - id: brief-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/brief.md
  - id: proposal-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/proposal.md
  - id: design-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/design.md
---

# Why

An agent tool's permission settings are the only thing that stops an agent before it pushes or opens a PR; a sentence in `AGENTS.md` only asks. `specfold permissions sync` turns the levels under `permissions` in `specfold.yaml` into Claude Code's `allow`, `ask` and `deny` rules, so the team decides once and every clone gets the same guard ([agent permissions](/decisions/agent-permissions.md)).

# Choices made while specifying and building

- **Owned patterns.** These are the rules the sync writes, in the order it appends them (`tools/specfold/src/permissions/actions.ts`), checked against Claude Code's docs on 2026-11-04 ([Claude Code](/references/claude-code.md)):

  | Action | Patterns |
  | --- | --- |
  | `push` | `Bash(git push *)` |
  | `force-push` | `Bash(git push *--force*)`, `Bash(git push -f*)`, `Bash(git push * -f*)`, `Bash(git push * +*)` |
  | `delete-remote-branch` | `Bash(git push *--delete*)`, `Bash(git push -d *)`, `Bash(git push * -d *)` |
  | `push-tags` | `Bash(git push *--tags*)`, `Bash(git push *--follow-tags*)` |
  | `open-pr` | `Bash(gh pr create *)` |
  | `merge-pr` | `Bash(gh pr merge *)`, `Bash(gh api *pulls/*/merge*)` |
  | `close-pr` | `Bash(gh pr close *)`, `Bash(gh api *pulls/*state=closed*)` |

  A team that writes one of these by hand into another list gets it moved by the next sync. A release that changes a pattern moves the old one to `RETIRED`, so the sync removes it everywhere.
- **The space form.** `*` may stand anywhere in a Claude Code rule, and `:*` is only an end-of-rule wildcard, so every pattern uses the space form. `--follow-tags` has a single dash before `tags`, so `*--tags*` misses it and it has its own pattern (found while building).
- **Sub-actions as strict as `push`.** Claude Code checks `deny`, then `ask`, then `allow`, and every sub-action command also starts with `git push`. A `force-push: allow` under `push: ask` would never take effect, so such a setting is invalid instead of a warning.
- **Never someone else's rule.** The sync removes an owned pattern from the two lists it does not belong in and appends it to its own when missing. A pattern already in place keeps its position, and every other rule, hook and key stays. A rerun changes nothing. The file is rewritten with two-space JSON on a change, which expands hand-formatted one-line entries (found when rendering the template).
- **Claude Code only when it is a target.** Rules are written only when `agents.targets` includes `.claude/skills`, the same condition graphify setup uses; otherwise the setting is still validated.
- **One pure core.** `render.ts` validates and plans without I/O; the command, doctor D8, init and `migrate install` all use it. The file I/O lives in `sync.ts`, apart from the command module: migrate install is imported by the CLI's skew check, and importing the command module there would close an import cycle back to the CLI (found while building).
- **Who runs it.** `init` runs it after `agents sync`, `migrate install` runs it after the settings merge and reports an invalid setting as a conflict, and `upgrade` runs it as a follow-up command. The settings merges of migrate and upgrade leave the owned patterns alone.
- **The template ships the rendered defaults.** `template/.claude/settings.json` already holds the `ask` rules, and `test/permissions-template.test.ts` keeps it in step with `template/specfold.yaml`.

# Related

- [specfold doctor](/capabilities/specfold-doctor.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [Permission rules tracked in the manifest](/decisions/permission-rules-tracked-in-manifest.md)
