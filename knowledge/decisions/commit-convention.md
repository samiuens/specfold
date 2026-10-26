---
type: Decision
title: Commit convention for the kit repo
description: Kit-repo commits use Conventional Commits with a type-matched gitmoji, subject only, the human as author and the agent as co-author; not shipped.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: config
    resource: ../../scripts/commit-convention.json
    title: Commit convention config (types, scopes, gitmoji mapping)
  - id: gitmoji
    resource: https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json
    title: Official gitmoji list (npm package gitmojis 3.15.0, 74 entries)
---

# Decision

Commits in the kit repo follow `<type>(<scope>): <gitmoji> <subject>`:

- English, lowercase (mixed-case identifiers in backticks), imperative, no trailing period, at most 72 characters.
- Subject only. The only lines allowed after one blank line are the trailers `Co-Authored-By:` and `Task: <change>#<n>.<m>` (from the [task breakdown](/decisions/task-breakdown.md)).
- One logical change per commit, matching "one task, one commit".
- Each type has a default gitmoji and a set of allowed ones; `!` plus 💥 marks a breaking change. 🚧, 💩 and 🍻 are not allowed.
- Scopes, the type-to-gitmoji mapping, allowed trailers and non-human author patterns live in one place: `scripts/commit-convention.json`. Gitmojis come only from the pinned npm package `gitmojis`; a new upstream gitmoji is rejected until the mapping is extended in a PR.
- The human user's git identity is always the author; an agent that wrote or substantially changed the content adds itself as `Co-Authored-By:` with its tool's name and address, without a model name or version.

Enforcement:

- `scripts/check-commit.mjs`, which depends only on the pinned `gitmojis` package. It runs from `.githooks/commit-msg` (set by `npm run setup`) until `specfold hook` ships in M4, and then through `hooks.extra.commit-msg` in the kit's `specfold.yaml`.
- The required CI check `commit-convention` runs over every commit of a PR and over the PR title.
- The kit repo allows only rebase merges, so the granular commits and their trailers land on the default branch unchanged.

The convention applies to the kit repo only: nothing of it goes into `template/` or into the upgrader's kit-owned files.

# Why

- A readable history.
- Changelog and release notes generated from commit subjects, grouped by type.
- A clean mapping from tasks to commits.

The emoji has to match the type so it carries information instead of decoration.

A tiny script was chosen over commitlint because it adds one small dependency instead of a plugin stack, and it can read the gitmoji list directly.

Decided by the maintainer on 2026-10-26. The same question round resolved the conflicts with existing decisions:
- The hook runs under [built-in git hooks](/decisions/built-in-git-hooks.md), not lefthook.
- The repo uses rebase merges only.
- The pre-convention root commit was reworded.

# Rejected alternatives

- commitlint with a custom plugin: more dependencies for the same checks.
- lefthook for the kit repo's own hooks: a second hook system next to the built-in one.
- Squash merges: would collapse granular commits and drop `Task:` trailers.
- Shortcodes (`:sparkles:`): render differently across tools.

# Related

- [Task breakdown](/decisions/task-breakdown.md)
- [Built-in git hooks](/decisions/built-in-git-hooks.md)
