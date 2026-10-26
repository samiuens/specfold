---
type: Reference
title: GitHub Actions and API for the merge gate
description: Token permissions, events and required-check behavior relevant to specfold-gate and rule G7, as documented on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: reviews
    resource: https://docs.github.com/en/rest/pulls/reviews
  - id: required
    resource: https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
  - id: events
    resource: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
  - id: prt
    resource: https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target
---

# Reviews

`GET /repos/{owner}/{repo}/pulls/{n}/reviews` needs `pull-requests: read`; results are chronological, paginated (max 100 per page). Only each reviewer's latest state counts; a later `CHANGES_REQUESTED` or `DISMISSED` replaces an `APPROVED`.[^reviews]

# Fork pull requests

The default token is read-only for fork PRs and gets no secrets; reading reviews still works. Posting comments (`issues: write` or `pull-requests: write`) fails with 403 unless a private repo enables write tokens for fork PRs. Workarounds: a separate `workflow_run` workflow that posts the comment, or check-run summaries.

# Required checks

- `pull_request_review` (`submitted`, `edited`, `dismissed`) counts toward required checks, like `push` and `pull_request`; `workflow_dispatch` does not.[^required]
- Required checks match on job name; checks must pass on the latest commit.
- A job skipped by `if:` counts as passing; a workflow filtered out by `paths:` leaves the check pending.
- A check run and a commit status with the same name both have to pass.
- Undocumented: whether a newer passing run replaces an older failed one under the same name.

# Merge queue and pull_request_target

- A merge queue only triggers workflows that list `merge_group`; those runs have no PR review context.[^events]
- `pull_request_target` will be blocked by default in public repos from 2026-12-02, and `actions/checkout` refuses fork PR heads under it without `allow-unsafe-pr-checkout: true`.[^prt]
