---
type: Reference
title: Git hook managers and core.hooksPath
description: lefthook 2.2 facts, the alternatives considered, and how core.hooksPath behaves across worktrees, as checked on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: lefthook
    resource: https://github.com/evilmartians/lefthook
    title: lefthook v2.2.2
    last_modified: 2026-10-13T00:00:00Z
  - id: glob
    resource: https://github.com/evilmartians/lefthook/blob/master/docs/configuration/glob.md
  - id: issue1398
    resource: https://github.com/evilmartians/lefthook/issues/1398
---

# lefthook

- Latest v2.2.2 (2026-10-13); nixpkgs has 2.1.15.[^lefthook]
- `commands:` is not deprecated; `jobs:` (since 1.10) is the newer list form. `parallel` and `{staged_files}` are valid.
- The default glob matcher treats `**` as one or more folders, so `knowledge/**/*.md` does not match `knowledge/index.md`; `glob_matcher: doublestar` or a list of globs fixes it.[^glob]
- Install routes: standalone binary, Homebrew, Go (`github.com/evilmartians/lefthook/v2`), pip/uv/pipx, gem, npm dev dependency and more.
- In worktrees, `lefthook install` writes into the shared `.git/hooks`, but the npm shim hardcodes one worktree's `node_modules` (issue #1398); further worktree issues: #1077, #1265, #1384.[^issue1398]

# Alternatives considered

- pre-commit (Python) and prek (Rust reimplementation of pre-commit): multi-language hook ecosystems.
- husky: Node only; essentially a managed `core.hooksPath`.
- hk: a newer, parallel hook manager.

Not re-checked against current docs; recorded as they were weighed for [built-in git hooks](/decisions/built-in-git-hooks.md).

# core.hooksPath

A relative `core.hooksPath` resolves against the working tree where the hook runs, and git config is shared by all worktrees of a repository, so one setting covers every worktree.
