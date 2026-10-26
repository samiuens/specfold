# Proposal

## Why

The merge gate runs in CI, but feedback arrives late there. Git hooks catch the same problems before a commit or push, for humans and agents alike, and Claude Code hooks catch them while the agent is still working (`/decisions/built-in-git-hooks.md`, `docs/plan.md`, "Agent layer"). The CLI decides what to check, so there is no second glob syntax in hook configs.

## What Changes

- `specfold hooks install [--json]`:
  - **Without a hook manager:** writes one-line scripts to `.specfold/hooks/` (pre-commit, pre-push, post-checkout, post-merge, plus every hook named in `hooks.extra`) and sets `core.hooksPath`.
  - **With a hook manager** (lefthook, husky, pre-commit/prek): adds one entry per hook to it instead.
- `specfold hook <name> [args...]`:
  - `pre-commit`: validates staged concepts, change-checks staged changes, and runs `openspec validate --all --strict` when `openspec/` is staged.
  - `pre-push`: runs `gate --base origin/HEAD --local`.
  - `post-checkout` and `post-merge`: run `graphify update .` when graphify is installed, and never fail.
  - Then the commands from `hooks.extra.<name>`.
- Claude Code hooks:
  - `specfold hook claude-session-start`: knowledge sections and active changes, at most 40 lines.
  - `specfold hook claude-post-tool-use`: validate or change check for the edited file, errors only, exit 2.
  - `specfold hook claude-stop`: the local gate, exit 2 on blocking findings.
- The kit switches from `.githooks/` to `specfold hooks install`.

## Capabilities

### New Capabilities
- `specfold-hooks`: installing git hooks or hook-manager entries, the checks each git hook runs, extra commands, and the Claude Code hook entry points.

### Modified Capabilities
- none

## Out of scope

- Registering the Claude Code hooks in `.claude/settings.json` (`add-gate-workflow`, together with the rest of the repo setup).

## Confirmed in review

1. **An existing `core.hooksPath`** that is not `.specfold/hooks` and belongs to no known manager makes `hooks install` stop with an environment error that names the path; it never overwrites another setup. The kit unsets its `.githooks` path as part of the switch.
2. **Manager detection order:** lefthook (`lefthook.yml`, `lefthook.yaml`, `.lefthook.yml`), husky (`.husky/`), pre-commit/prek (`.pre-commit-config.yaml`). The first one found gets the entries.
3. **Idempotent:** entries named `specfold` (lefthook command, pre-commit hook id `specfold-<hook>`, the husky line) are not added twice.
4. **pre-push without `origin/HEAD`:** the hook tries `git symbolic-ref refs/remotes/origin/HEAD`, then `origin/main`. If no base resolves, it prints a warning and lets the push through, because CI still gates.
5. **Extra commands** run with `sh -c`; the hook's own arguments are passed as `$1`, `$2` and so on. A failing extra command fails the hook.
6. **Claude hooks read the event JSON from stdin.** `claude-post-tool-use` only reacts to `Edit` and `Write` of files under `knowledge/` or `openspec/changes/`, and stays silent otherwise.

## Impact

- New module `src/hooks/`; the kit's `.githooks/` folder is removed and `specfold.yaml` keeps `hooks.extra.commit-msg`.
- Consumers: `specfold init` and `sf-migrate` (later), the Claude Code settings (`add-gate-workflow`).
