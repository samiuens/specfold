# Proposal

## Why

A gate nobody is forced through is advice. The template ships the workflow that makes `specfold-gate` a required check, the summary that tells authors what to fix, and the repository files that route decisions and specs to maintainers (`/decisions/blocking-merge-gate.md`). The kit turns the same gate on for itself (`/decisions/self-hosting.md`).

## What Changes

- `template/.github/workflows/specfold-gate.yml`: triggers on `pull_request`, `pull_request_review` (`submitted`, `dismissed`) and `merge_group`; one job named `specfold-gate`, no `paths:` filter and no job-level `if:`. It runs `specfold gate --base <merge base> --pr <number> --label … --pr-body …` with `pull-requests: read`, and writes the summary into the job summary.
- `template/.github/workflows/specfold-gate-comment.yml`: on `workflow_run`, posts or updates one summary comment, which also works for fork PRs.
- `template/.claude/settings.json`: the three Claude Code hooks (`claude-session-start`, `claude-post-tool-use` on Edit and Write, `claude-stop`).
- `template/.github/CODEOWNERS` (`knowledge/decisions/`, `openspec/specs/`) and `template/.github/pull_request_template.md` (`Change:`, `Knowledge:`, `No-spec reason:`).
- `template/.gitignore`: `.specfold/local.yaml` (since `add-specfold-verify`), plus `.claude/worktrees/`.
- `specfold gate --summary <file>` writes the Markdown summary.
- The kit: the same gate workflow (adapted to its own paths), the comment workflow, `.claude/settings.json`, CODEOWNERS and the PR template, test PRs, then `specfold-gate` added to the required checks of ruleset 25866688. (`specfold hooks install` already replaced `.githooks/` in `add-specfold-hooks`.)

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-gate`: adds `--summary <file>`, the Markdown summary the workflow posts (decided when implementation started, instead of an untested script inside the workflow).

## Out of scope

- G11 and G15-G17.

## Confirmed in review

1. **Summary format:** one Markdown table, with rule, effect, path, message and fix, plus a line per warning count. The same text goes into the job summary and the comment.
2. **Test PRs on the kit:**
   - G4 without a label (expected to fail), then with `no-spec` and a reason (expected to pass);
   - G7 with a stranger's `verified` (expected to fail);
   - one clean PR (expected to pass).

   Each is a draft and is closed after its check result is recorded in the change's PR.
3. **Merge queue:** in `merge_group` runs there is no PR, so the job runs `gate --local`: G4 and G7 warn, every other rule still blocks; the PR's own run already enforced G4 and G7 (decided when implementation started).
4. **The kit dogfoods** `.claude/settings.json`, the PR template and the workflows; the sample app gets the settings too, and CI keeps the copies equal (decided when implementation started).
5. **CODEOWNERS** in the template holds commented examples for `/knowledge/decisions/` and `/openspec/specs/`; the kit's file names @samiuens (decided when implementation started).
6. **Required check:** `specfold-gate` joins `commit-convention`, `cli (20)` and `cli (24)` in the ruleset, after the test PRs behave as expected. This changes the repository settings, so I ask before doing it.

## Impact

- New files under `template/.github/`, `template/.claude/`, and the kit's `.github/`; the ruleset change on GitHub.
