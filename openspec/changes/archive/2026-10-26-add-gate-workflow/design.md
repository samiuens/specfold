# Design

## Context

`specfold gate` already takes `--pr`, `--label` and `--pr-body` (`add-gate-github`, `add-specfold-gate`), and the Claude Code hook entry points exist (`add-specfold-hooks`). Fork PRs get a read-only token, so a comment can only be posted from a separate `workflow_run` workflow (`/references/github-actions.md`).

## Goals / Non-Goals

**Goals:** one required job named `specfold-gate` that always reports; a summary in the job and as one PR comment, also for forks; the same setup in the kit.

**Non-Goals:** G11 and G15-G17; `specfold init` filling in CODEOWNERS (M8).

## Decisions

- **Summary (`src/gate/summary.ts`):** `renderSummary(findings)` returns `## specfold gate: <verdict>`, a table `Rule | Effect | Path | Message | Fix` in output order (paths in backticks, `|` escaped, newlines flattened), and `Warnings: G12 2, G18 1` or `Warnings: none`. `--summary <file>` writes it next to the normal output.
- **Gate workflow:** triggers on `pull_request` (`opened`, `synchronize`, `reopened`, `edited`, `labeled`, `unlabeled`, `ready_for_review`), `pull_request_review` (`submitted`, `dismissed`) and `merge_group`; permissions `contents: read`, `pull-requests: read`. It checks out the PR head with full history and gates against `origin/<base ref>`. Labels come from the event as JSON (`jq`), the body is written to a file, and `--pr` gets the PR number. The exit code is kept in a step output, so the summary always reaches `$GITHUB_STEP_SUMMARY` and an artifact (`summary.md`, `pr-number`) before the last step fails the job. A run that could not gate (exit 2) gets a summary saying so. In `merge_group`, the step runs `gate --base <merge group base> --local`.
- **OpenSpec in CI:** the template installs the pinned `@fission-ai/openspec@1.15.0` globally; the kit uses its own `npm ci`.
- **Comment workflow:** on `workflow_run` of `specfold-gate` (`completed`), with `pull-requests: write` and `actions: read`. It downloads the artifact, accepts only a numeric PR number whose head SHA equals the run's `head_sha`, and creates or updates one comment marked `<!-- specfold-gate -->` through `gh api`. The artifact is treated as data: nothing from it is executed.
- **Claude Code settings:** `SessionStart`, `PostToolUse` (matcher `Edit|Write`) and `Stop`, each running `cd "$CLAUDE_PROJECT_DIR" && node scripts/specfold.mjs hook <name>`.
- **Copies:** kit and sample app get the template's `.claude/settings.json`; the kit gets the comment workflow and the PR template unchanged and its own gate workflow; CI compares the copies.

## Risks / Trade-offs

- [`workflow_run` uses the workflow file from the default branch] → the comment can only be checked after this change is merged; the test PRs check the job and its summary.
- [Review events create a second `specfold-gate` check run on the same commit] → both report the same verdict for the same state; GitHub uses the latest.
