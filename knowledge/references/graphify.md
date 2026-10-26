---
type: Reference
title: graphify 0.9.95
description: graphify's install routes, code-only mode, ignore file, refresh and query commands, as read from the 0.9.95 package on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T15:22:28+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: pypi
    resource: https://pypi.org/project/graphifyy/
    title: graphifyy 0.9.95 on PyPI
    last_modified: 2026-10-23T00:00:00Z
  - id: repo
    resource: https://github.com/Graphify-Labs/graphify
  - id: docs
    resource: https://docs.graphify.com/guides/incremental-updates
---

# Summary

PyPI package `graphifyy` 0.9.95 (2026-10-23), repo Graphify-Labs/graphify, docs at docs.graphify.com. It parses code locally with tree-sitter into `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md`.[^pypi]

# Install routes

- `graphify install [--project] [--strict] [--platform P]`; `agents` (alias `skills`) is a platform. With `--platform agents` it writes only `./.agents/skills/graphify/SKILL.md`, no instruction block and no hook.[^repo]
- `graphify agents install` writes a `## graphify` section into `AGENTS.md`.
- `graphify claude install [--project] [--strict]` writes a `## graphify` section into `CLAUDE.md` and registers PreToolUse hooks on `Bash|Grep` and `Read|Glob` that call `graphify hook-guard`. `--strict` blocks the first raw read per session until a `graphify query` has run.
- Section writes are idempotent. The README warns against two unconditional instruction blocks in `AGENTS.md` when using both CLI and MCP.

# Local-only mode

- `graphify extract --code-only` indexes code and skips docs, papers and images.
- `GRAPHIFY_BACKEND=none` disables every LLM backend, including the `claude -p` labelling fallback.
- `graphify update <path>` re-extracts incrementally without an LLM; `--force` when a rebuild has fewer nodes.[^docs]

# Other

- `.graphifyignore` uses gitignore syntax (last match wins, nested files); `.gitignore` is honoured unless `--no-gitignore`.
- `graphify hook install` installs post-commit, post-checkout, post-merge and post-rewrite git hooks.
- `graphify query "<q>"` (`--budget`, `--seed`, `--dfs`, `--graph`), `graphify path "A" "B"`, `graphify explain "X"`; exit 0 on an answer, 3 when ambiguous, 4 when nothing matches.

# Related

- [graphify is optional and code-only](/decisions/graphify-code-only.md)
