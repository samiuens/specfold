# Proposal

## Why

Agents write `status: draft` and only humans verify (`/decisions/humans-verify-only.md`), and only the user confirms a brief. A file can still claim `human:<login>` for anyone. G7 checks those claims against GitHub: a login added by a PR must be the PR's author or an approving reviewer (`docs/plan.md`, "G7 on GitHub").

## What Changes

- `specfold gate` gets `--pr <number>`. With it, the gate reads the PR author and reviews from the GitHub REST API (`GITHUB_TOKEN`, `GITHUB_REPOSITORY`, optional `GITHUB_API_URL`) and runs rule G7.
- G7 blocks for every `human:<login>` the diff adds, in a `verified` entry of a concept or a brief's `confirmed_by`, that is neither the PR author nor a reviewer whose latest review is `APPROVED`.
- Without `--pr`, the gate warns that G7 could not run whenever the diff adds such a claim.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-gate`: adds rule G7 and the `--pr` option.

## Out of scope

- Workflow wiring and fork handling (`add-gate-workflow`).

## Confirmed in review

1. **"Added" claims** are those present in the head version of a changed file but not in its merge-base version, compared per concept (`verified` entries) and per brief (`confirmed_by`).
2. **API errors** (missing token, 404, rate limit) are environment errors (exit 2), never a pass.
3. **Pagination:** reviews are read page by page (100 per page) until a short page.
4. **The API base** comes from `GITHUB_API_URL` (set by GitHub Actions, and in tests to a local server), defaulting to `https://api.github.com`.

## Impact

- New module `src/gate/github.ts`; tests run against a local HTTP server.
