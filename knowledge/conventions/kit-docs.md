---
type: Convention
title: Guides in docs, knowledge links to them
description: The guides in docs/ are for people using the kit; the knowledge bundle links to them, and docs/commands.md is generated from the CLI's help.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T08:20:21+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-29-add-kit-docs/proposal.md
    title: "Proposal of add-kit-docs"
---

# Convention

The kit has two audiences, and each gets its own place:

- **People using the kit** read the root `README.md` and the guides in `docs/`: getting started, workflow, the command reference, upgrading and releasing. The guides explain how to do things. When they need a rule, they link to a spec or describe the behavior without restating its requirements.
- **People building the kit** read this knowledge bundle: why things are the way they are, what was decided and rejected, and how the kit's own maintenance runs. A concept that covers the same ground as a guide links to it instead of repeating it. [Cut a release](/runbooks/cut-a-release.md), for example, keeps only the kit-internal steps and points to `docs/releasing.md` for the rest.

`docs/commands.md` is never edited by hand. `node tools/specfold/docs.mjs` writes it from the bundled CLI's `--help` output: one section per command, with its summary and usage line. CI runs `docs.mjs --check` after the bundle check, so a command whose usage changes without a regenerated reference fails the PR. To change the reference, change the command's `summary` or `usage` in its source, rebuild the bundle and rerun `docs.mjs`.

`docs/plan.md` stays as the historical build brief. It is kept as written and says so on its first line.

# Why

Before v0.1.0, everything a new user needed was spread over the build brief, the template's `AGENTS.md`, skills and `--help` output. One set of guides gives that a home, and keeping them out of the knowledge bundle keeps the bundle about the kit's own reasoning. A hand-written command list would drift from the CLI with the first new flag; generating it from the same strings `--help` prints rules that out.

# Related

- [Self-hosting](/decisions/self-hosting.md)
- [Cut a release](/runbooks/cut-a-release.md)
- [specfold CLI](/architecture/specfold-cli.md)
