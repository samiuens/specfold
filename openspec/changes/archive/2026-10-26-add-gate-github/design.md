# Design

## Context

`specfold gate` (`src/gate/`) runs synchronous rules over a `GateContext` built from the diff (`computeDiff`). The merge base is known, so a file's base version is `git show <merge base>:./<path>`. Node 20 ships `fetch`, so no HTTP dependency is needed.

## Goals / Non-Goals

**Goals:** G7 checks every human claim a PR adds against the PR author and its approving reviewers; requests happen once, before the rules run, so rules stay synchronous and testable without a network.

**Non-Goals:** the workflow that passes `--pr` and the token (`add-gate-workflow`); `specfold verify` itself (`add-specfold-verify`).

## Decisions

- **Claims (`src/gate/claims.ts`):** for each changed file that still exists, a concept's `verified` (a mapping or a list of mappings) yields its `by` values, and a `brief.md` under `openspec/changes/` (active or archived) yields its `confirmed_by` value. Only values starting with `human:` count. A claim is added when the head version has it and the merge-base version of the same file does not; the head version is the working tree, which equals HEAD in CI.
- **GitHub (`src/gate/github.ts`):** `fetchPullRequest(env, number)` reads `GET /repos/{repo}/pulls/{n}` for the author and `GET /repos/{repo}/pulls/{n}/reviews?per_page=100&page=k` until a short page. Per reviewer, the latest review that is not `COMMENTED` (or `PENDING`) decides; only `APPROVED` counts. The result is `{ author, approvers }`, logins lowercased. Missing `GITHUB_TOKEN` or `GITHUB_REPOSITORY`, a non-2xx response or a network error is an `EnvError`; the message names the status and URL path, never the token.
- **Context:** `GateContext` gets `pr: { number, author, approvers } | undefined`. The command fetches before `runGate`; with `--pr` it always fetches, so a missing token fails even when no claim is added.
- **Rule G7:** with `pr`, a blocking finding per added claim whose login is neither the author nor an approver, at the claim's file and line. Without `pr`, one warning (path null) when any claim is added, saying CI checks it with `--pr`.
- **`--pr`:** a positive integer, otherwise a usage error.

## Risks / Trade-offs

- [Rate limits on large PRs] → at most 1 + ceil(reviews/100) requests per gate run.
- [A login renamed on GitHub after the claim was written] → the claim no longer matches and blocks; the fix is to write the current login.
