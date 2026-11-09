---
type: Capability
title: specfold hooks
description: Why Specfold ships its own git and Claude Code hook entry points, and where their contract lives.
status: draft
spec: openspec/specs/specfold-hooks/spec.md
resource: ../../openspec/specs/specfold-hooks/spec.md
change: 2026-11-09-add-okf-bundle-migration
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:58:22+01:00 }
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
  - id: proposal-2026-10-28-fix-upgrade-follow-ups
    resource: ../../openspec/changes/archive/2026-10-28-fix-upgrade-follow-ups/proposal.md
  - id: proposal-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/proposal.md
  - id: design-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/design.md
  - id: proposal-2026-10-30-stop-hook-skips-pending-test-references
    resource: ../../openspec/changes/archive/2026-10-30-stop-hook-skips-pending-test-references/proposal.md
  - id: proposal-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/proposal.md
  - id: design-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/design.md
  - id: proposal-2026-11-09-add-okf-bundle-migration
    resource: ../../openspec/changes/archive/2026-11-09-add-okf-bundle-migration/proposal.md
  - id: design-2026-11-09-add-okf-bundle-migration
    resource: ../../openspec/changes/archive/2026-11-09-add-okf-bundle-migration/design.md
---

# Why

The gate in CI is the enforcement, but its feedback comes late. Hooks run the same checks earlier: before a commit, before a push, and while Claude Code is still working. Every hook calls one CLI entry point, `specfold hook <name>`, so hook configurations never hold globs or logic ([built-in git hooks](/decisions/built-in-git-hooks.md)), and the checks match CI ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **Never break another setup.** `specfold hooks install` writes `.specfold/hooks/` and sets `core.hooksPath` only when no hook manager is in use. With lefthook, husky or pre-commit/prek it adds one `specfold` entry per hook to that manager instead, and a foreign `core.hooksPath` without a manager stops the command. A `specfold.yaml` below the git root is refused too, because `core.hooksPath` applies to the whole repository.
- **Check what is staged or edited.** pre-commit validates staged concepts and checks staged changes; the Claude Code post-tool-use hook does the same for the one file an `Edit` or `Write` touched. A change without `tasks.md` is still being planned, so only its brief is checked, as in the gate.
- **Local hooks never replace CI.** pre-push runs the local gate (where G4 only warns) and lets the push through when no `origin/HEAD` or `origin/main` exists. The Claude Code stop hook keeps blocking while blocking findings remain, except G15 findings for scenarios of changes not yet archived, which it prints as not blocking. Claude Code's limit of consecutive blocks resets with every new turn ([Claude Code](/references/claude-code.md)), so while a change was being planned or built and its tests did not exist yet, G15 blocked every stop for the whole session; the PR gate still enforces G15 before merge ([specfold gate](/capabilities/specfold-gate.md), [specfold trace](/capabilities/specfold-trace.md)).
- **Project commands stay in one place.** `hooks.extra` in `specfold.yaml` lists extra commands per hook; they run with `sh -c` after Specfold's own checks, with the hook's arguments as `$1`, `$2`. The kit's commit-message check runs this way ([commit convention](/decisions/commit-convention.md)).
- **Promises due soon are visible at the start.** The session-start hook adds one line with the number of open commitments due within 30 days, overdue ones included, and only when there are any ([specfold commitments](/capabilities/specfold-commitments.md)).
- **Implementers can't push.** `hook claude-no-push`, wired into the implementer's own frontmatter, refuses a Bash command that runs `git push` or `gh pr` in any segment (also after `git -C <dir>` or variable assignments) and tells the agent to return its branch instead; anything unreadable passes, so the guard never blocks other work.
- **Manager files keep their shape.** Entries in `lefthook.yml` and `.pre-commit-config.yaml` are added to the parsed document, which is written back without folding: the `yaml` library would fold long lines at 80 characters by default, so every YAML rewrite in the CLI writes without folding (found in the sample app's upgrade to rc.2).
- **A waiting release shows at session start.** Once a day at most, within 2 seconds and silently when offline, the session-start hook checks the repository's channel and names a newer release ([upgrade flow](/architecture/upgrade-flow.md)). The check is cached in the gitignored `.specfold/local-state.json`, and `upgrade.reminder: false` turns it off.
- **The graph is refreshed, never built.** post-checkout and post-merge run `graphify update .` only when graphify is installed and `graphify-out/graph.json` exists ([graphify](/references/graphify.md)).
- **Manager files keep their text.** `hooks install` inserts its entries as text at parsed offsets, so flow lists, folded scalars and long lines elsewhere stay unchanged ([splice hook manager YAML](/decisions/splice-hook-manager-yaml.md)). The Claude stop hook still blocks; above 20 blocking findings it prints counts per rule and the first 10 findings instead of repeating all of them.
- **A migration's conversion is relieved, the gate is not.** While `.specfold/migration/state.json` exists without `convert`, pre-commit and the Claude post-edit hook print broken links and findings in files still equal to the base commit as warnings, and the Claude stop hook does not block on such G1 and G10 findings but lists them. pre-push and the gate are unchanged ([a migration rewrites an existing OKF bundle](/decisions/existing-bundle-migration.md), [plan-aware link relief](/decisions/plan-aware-link-relief.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [A migration rewrites an existing OKF bundle](/decisions/existing-bundle-migration.md)
