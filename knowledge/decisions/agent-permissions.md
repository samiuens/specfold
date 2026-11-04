---
type: Decision
title: Agent permissions declared in specfold.yaml
description: Outward-facing agent actions are declared once in specfold.yaml and rendered into Claude Code rules; prefix rules are best effort, AGENTS.md is the contract.
status: draft
decision: accepted
change: 2026-11-04-add-agent-permissions
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-04T08:44:27+01:00 }
sources:
  - id: proposal-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/proposal.md
  - id: brief-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/brief.md
---

# Decision

A project declares in `specfold.yaml`, under `permissions`, which outward-facing actions an agent may take on its own. The set of actions is fixed: `push`, `force-push`, `delete-remote-branch`, `push-tags`, `open-pr`, `merge-pr` and `close-pr`. Each gets `allow`, `ask` or `deny`; a missing action counts as `ask`, and the template sets `ask` for all. `specfold permissions sync` renders the levels into Claude Code's `permissions` lists in `.claude/settings.json` ([specfold permissions sync](/capabilities/specfold-permissions.md)), and `AGENTS.md` states the same rule for every other tool. Decided by the maintainer on 2026-11-04 (change `add-agent-permissions`).

# Why

On 2026-10-29 an agent pushed a branch and opened a PR before the user had reviewed the work, because `AGENTS.md` said each feature ends with a PR and nothing said to ask first ([rather ask than assume](/decisions/rather-ask-than-assume.md)). Following [tool-neutral first](/decisions/tool-neutral-first.md), the sentence in `AGENTS.md` is the contract every tool reads; Claude Code's rules enforce it on top.

- **Named actions, not raw patterns.** Users pick a level; the kit owns the command patterns and can improve them in a release without touching anyone's settings.
- **Committed, team-wide settings.** The rules go into `.claude/settings.json`, never `.claude/settings.local.json`, so the whole team gets the same guard.
- **Best effort, on purpose.** Claude Code matches the command text Claude writes ([Claude Code](/references/claude-code.md), Permissions). The rules catch the usual `git push`, `gh pr` and `gh api` forms but not `git -C . push`, `git -c x=y push`, aliases or scripts. They also miss deleting a branch with an empty-source refspec (`git push origin :old`), because a rule ending in `:*` is read as a wildcard, and pushing a tag by name (`git push origin v1.0`). All of these still hit the `push` rule. The `gh api` merge rule also matches the read-only check whether a PR is merged.

# Rejected alternatives

- **Tracking the rendered rules in the install manifest** ([rejected](/decisions/permission-rules-tracked-in-manifest.md)).
- **Raw custom patterns in `specfold.yaml`:** out of scope for now; teams write their own rules directly into `.claude/settings.json`, and the sync keeps them.
- **A gate rule for drift:** doctor check D8 reports it; a merge block would punish a team for a local tool setting.
- **Renderers for other tools now:** they wait for a survey of their formats, together with [read barriers for other agents](/backlog/read-barriers-for-other-agents.md).

# Related

- [Upgrade file classes](/decisions/upgrade-file-classes.md)
- [Managed blocks](/decisions/managed-blocks.md)
- [Agent permissions in specfold.yaml](/backlog/agent-permissions-in-specfold-yaml.md)
