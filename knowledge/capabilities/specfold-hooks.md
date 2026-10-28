---
type: Capability
title: specfold hooks
description: Why Specfold ships its own git and Claude Code hook entry points, and where their contract lives.
status: draft
spec: openspec/specs/specfold-hooks/spec.md
resource: ../../openspec/specs/specfold-hooks/spec.md
change: 2026-10-28-add-subagent-roles
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T17:11:42+01:00 }
sources:
  - id: proposal-2026-10-26-add-specfold-hooks
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-hooks/proposal.md
  - id: design-2026-10-26-add-specfold-hooks
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-hooks/design.md
  - id: proposal-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/proposal.md
  - id: design-2026-10-26-add-specfold-backlog
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-backlog/design.md
  - id: proposal-2026-10-28-add-subagent-roles
    resource: ../../openspec/changes/archive/2026-10-28-add-subagent-roles/proposal.md
  - id: design-2026-10-28-add-subagent-roles
    resource: ../../openspec/changes/archive/2026-10-28-add-subagent-roles/design.md
---

# Why

The gate in CI is the enforcement, but its feedback comes late. Hooks run the same checks earlier: before a commit, before a push, and while Claude Code is still working. Every hook calls one CLI entry point, `specfold hook <name>`, so hook configurations never hold globs or logic ([built-in git hooks](/decisions/built-in-git-hooks.md)), and the checks match CI ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **Never break another setup.** `specfold hooks install` writes `.specfold/hooks/` and sets `core.hooksPath` only when no hook manager is in use. With lefthook, husky or pre-commit/prek it adds one `specfold` entry per hook to that manager instead, and a foreign `core.hooksPath` without a manager stops the command. A `specfold.yaml` below the git root is refused too, because `core.hooksPath` applies to the whole repository.
- **Check what is staged or edited.** pre-commit validates staged concepts and checks staged changes; the Claude Code post-tool-use hook does the same for the one file an `Edit` or `Write` touched. A change without `tasks.md` is still being planned, so only its brief is checked, as in the gate.
- **Local hooks never replace CI.** pre-push runs the local gate (where G4 only warns) and lets the push through when no `origin/HEAD` or `origin/main` exists. The Claude Code stop hook keeps blocking while blocking findings remain; Claude Code's limit of 8 consecutive blocks ends any loop ([Claude Code](/references/claude-code.md)).
- **Project commands stay in one place.** `hooks.extra` in `specfold.yaml` lists extra commands per hook; they run with `sh -c` after Specfold's own checks, with the hook's arguments as `$1`, `$2`. The kit's commit-message check runs this way ([commit convention](/decisions/commit-convention.md)).
- **Promises due soon are visible at the start.** The session-start hook adds one line with the number of open commitments due within 30 days, overdue ones included, and only when there are any ([specfold commitments](/capabilities/specfold-commitments.md)).
- **Implementers can't push.** `hook claude-no-push`, wired into the implementer's own frontmatter, refuses a Bash command that runs `git push` or `gh pr` in any segment (also after `git -C <dir>` or variable assignments) and tells the agent to return its branch instead; anything unreadable passes, so the guard never blocks other work.
- **The graph is refreshed, never built.** post-checkout and post-merge run `graphify update .` only when graphify is installed and `graphify-out/graph.json` exists ([graphify](/references/graphify.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
