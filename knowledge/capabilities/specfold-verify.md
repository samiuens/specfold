---
type: Capability
title: specfold verify
description: Why specfold verify writes human verification for the person at the keyboard, and where its contract lives.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T16:52:58+01:00 }
---

# Why

Trust in the bundle rests on humans checking what agents drafted ([humans verify only](/decisions/humans-verify-only.md)). Writing `verified` by hand invites mistakes and makes it easy for an agent to do it for someone. `specfold verify <path>...` writes `status: stable` and `verified: { by: human:<login>, at: <now> }` for the person at the keyboard; gate rule G7 then checks that login against the PR's author and approvers ([specfold gate](/capabilities/specfold-gate.md)).

# Choices made while specifying and building

- **Where the login comes from.** `gh api user` first, then `actors.github_login` in `.specfold/local.yaml`, a personal file that the template's `.gitignore` excludes. With neither, the command stops and names both options.
- **A guard, not a lock.** The command refuses when `CLAUDECODE` or `SPECFOLD_MODEL` is set or stdin is not a terminal. That prevents accidents; G7 in CI is the real check.
- **All or nothing.** Every path is checked before anything is written: it must be a concept in the bundle (not `index.md` or `log.md`) and not deprecated. One bad path means nothing is written.
- **Several reviewers.** A second reviewer turns `verified` into a list; verifying again with the same login replaces that person's entry. Edits are line-level, so the rest of the frontmatter keeps its exact text.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
