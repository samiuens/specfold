# Specfold

Specs and knowledge folded into one agent workflow:

- an [OKF](https://github.com/GoogleCloudPlatform/open-knowledge-format) knowledge bundle in `knowledge/` holds the *why and what*: decisions, terms, business rules, runbooks;
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/` holds the *how*: behavior contracts and the changes that edit them;
- a CLI (`node scripts/specfold.mjs`) and a required CI gate keep both honest. Every behavior change goes through a planned change, and the knowledge it touches moves with it.

Coding agents get skills for each step: planning interview, apply, sync, lookup, capture, audit, migrate and upgrade. Claude Code also gets six subagents (planner, spec-writer, implementer, verifier, knowledge-curator, scout), and runs task groups in parallel worktrees.

## Install

You need Node.js 20 or later, git, and `gh` logged in with access to `samiuens/specfold` (the kit repository is private). OpenSpec 1.15 or later goes on the PATH or in `node_modules/.bin`.

| Your repository | How |
| --- | --- |
| **New or empty** | Paste [`BOOTSTRAP.md`](BOOTSTRAP.md) into your coding agent at the repository root. It downloads the newest release, checks its SHA-256, copies the kit in and runs `specfold init`. |
| **New, by hand** | Download `specfold-template-<version>.tar.gz` and its `.sha256` from a release, check the hash, unpack it into the repository (`tar -xzf <file> --strip-components=1`), and run `node scripts/specfold.mjs init`. |
| **Existing code and docs** | Paste `BOOTSTRAP.md` into your agent as well. It finds tracked files and runs the `sf-migrate` skill: an inventory, a mapping plan you approve, the kit install and draft concepts from your docs, all in one PR on `specfold/migration`. |

Details, including what init asks and what lands in the repository: [Getting started](docs/getting-started.md).

## Quick start

After install, in Claude Code:

1. `claude --agent planner --permission-mode plan`, then say what you want. The planner looks things up, asks you about every open decision and writes the change only after you approve the plan.
2. In a normal session: "apply `<change>`". The `sf-apply` skill runs one implementer per task group, one commit per task.
3. `node scripts/specfold.mjs change check <change>` and `openspec validate --all --strict`.
4. `/opsx:archive`, then the `sf-sync` skill, and open the PR. The `specfold-gate` check decides whether it may merge.

Other agents use the `sf-plan` skill for step 1 and work the task groups one after another. The full loop: [Workflow](docs/workflow.md).

## Guides

- [Getting started](docs/getting-started.md): install, init, the first change.
- [Workflow](docs/workflow.md): plan, apply, check, archive and sync; parallel work; the gate.
- [Command reference](docs/commands.md): every CLI command, generated from its help.
- [Upgrading](docs/upgrading.md): channels, sources, private repositories, tokens, weekly upgrade PRs, conflicts.
- [Releasing](docs/releasing.md): how the kit itself is released (maintainers).

## This repository

Specfold is built with Specfold: the kit's own knowledge and specs live at the root, and what a repository receives lives in `template/`.

| Path | Content |
| --- | --- |
| `template/` | the payload a repository receives; packed into each release's tarball |
| `knowledge/`, `openspec/`, `specfold.yaml`, `AGENTS.md`, `CLAUDE.md` | the kit's own knowledge, specs and settings; none of it is shipped |
| `tools/specfold/` | CLI source, tests and release tooling |
| `scripts/specfold.mjs` | the bundled CLI (build output, committed) |
| `upgrade/` | upgrade notes and migrations, shipped in every tarball |
| `examples/sample-app/` | a worked example, upgraded from each release |
| `docs/` | the guides; `docs/plan.md` is the historical build brief |
