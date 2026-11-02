---
type: Runbook
title: Turn on upgrade PRs
description: How a team turns on the weekly upgrade workflow, which token it needs, and what the workflow does with older upgrade PRs.
status: draft
stale_after: 2027-01-26T19:00:37+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T12:44:09+01:00 }
---

# When to use

When a team wants Specfold upgrades to arrive as pull requests, like Dependabot updates, instead of running `specfold upgrade` by hand. Every installed repository has the workflow inactive at `.specfold/workflows/specfold-upgrade.yml`. Turning it on copies it to `.github/workflows/`, and from then on upgrades keep that copy current.

# Steps

1. **Turn it on:** `node scripts/specfold.mjs init --upgrade-workflow` in a repository made from the template, or `migrate install --upgrade-workflow` during a migration. `BOOTSTRAP.md` and `sf-migrate` ask about it. Commit `.github/workflows/specfold-upgrade.yml` and `.specfold/manifest.json`.
2. **Create the token.** It must, in this repository, write contents, pull requests and workflows; the public kit's releases need no extra access. An upgrade may change `.github/workflows/specfold-gate.yml`, and pushing that needs the workflows permission. A private source must also be readable: a fine-grained token covers both repositories only when they have the same owner, otherwise use a classic token with `repo` and `workflow`.
3. **Store it** as the repository secret `SPECFOLD_TOKEN` (Settings > Secrets and variables > Actions).
4. **Try it:** run the workflow by hand (Actions > specfold-upgrade > Run workflow) and read its log.

# What the workflow does

- **Schedule:** every Monday at 06:17 UTC, and on demand.
- **Without the secret,** it ends green with a notice naming it.
- **When `upgrade --check` finds a newer release:**
  - if the branch `specfold/upgrade-<version>` already exists, it does nothing;
  - otherwise it runs `upgrade --yes --pr` with `github-actions[bot]` as the commit author, so the PR shows the token's owner. Conflicts still open the PR, which lists them;
  - after opening the new PR, it closes older open `specfold/upgrade-*` PRs with a link to the new one.

# Verify

- A manual run without the secret shows the notice.
- With the secret and a newer release on the channel, a PR `specfold/upgrade-<version>` opens, carrying `.specfold/upgrade-report.md`.

# Related

- [specfold upgrade](/capabilities/specfold-upgrade.md)
- [Upgrade flow](/architecture/upgrade-flow.md)
