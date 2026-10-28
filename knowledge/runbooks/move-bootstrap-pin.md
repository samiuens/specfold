---
type: Runbook
title: Move the bootstrap pin
description: How to move the kit commit BOOTSTRAP.md pins after a change to template/ merges.
status: draft
stale_after: 2027-01-26T08:14:46+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T08:14:46+01:00 }
sources:
  - id: bootstrap
    resource: ../../BOOTSTRAP.md
    title: "BOOTSTRAP.md, the KIT_REF lines"
---

# When to use

After a PR that changes `template/` (skills, CLI bundle, schema, template files) is merged, so that `BOOTSTRAP.md` hands out the new snapshot. Rebase merges give the merged commits new shas, so the pin cannot move inside the PR itself; it always follows in a small PR of its own. M9 replaces the sha with a release tag.

# Steps

1. Update `main` and take its full sha: `git rev-parse origin/main`.
2. On a new branch, replace the sha in both `KIT_REF=` lines of `BOOTSTRAP.md`.
3. Commit as `docs(migrate): 📝 pin the bootstrap kit to <short sha>` and open the PR.

# Verify

- The cli workflow's step "Bootstrap pin is a commit on main with sf-migrate" passes: one sha, an ancestor of `main`, with `template/.agents/skills/sf-migrate/SKILL.md`.
- Optionally, run the fetch commands from `BOOTSTRAP.md` in a scratch folder and list `$KIT/template/`.

# Related

- [Delivered as template repo, bootstrap prompt and migration skill](/decisions/delivery-template-bootstrap-migrate.md)
- [specfold init](/capabilities/specfold-init.md)
