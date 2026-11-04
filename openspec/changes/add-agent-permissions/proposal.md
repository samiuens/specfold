# Proposal

## Why

Nothing in a Specfold repository tells an agent which outward-facing actions need the user's go-ahead. On 2026-10-29 an agent pushed a branch and opened a PR before the user had reviewed the work, because `AGENTS.md` says each feature ends with a PR ([rather ask than assume](/decisions/rather-ask-than-assume.md)). A rule declared once in `specfold.yaml` and rendered into the agent tool's own permission settings makes the agent ask first.

## What Changes

- **`permissions` in `specfold.yaml`:** a fixed set of named actions: `push`, `force-push`, `delete-remote-branch`, `push-tags`, `open-pr`, `merge-pr` and `close-pr`. Each one is set to `allow`, `ask` or `deny`. An action with no setting counts as `ask`, and the template sets `ask` for all of them. A sub-action of `push` that is looser than `push` makes the setting invalid.
- **`specfold permissions sync [--check] [--json]`:** when `agents.targets` includes `.claude/skills`, it writes each action's Bash rule patterns into the matching `permissions.allow`, `ask` or `deny` list of `.claude/settings.json`. It owns exactly those patterns and keeps every other rule. `--check` writes nothing and exits 1 when something would change.
- **`init`, `migrate install`, `upgrade`:** each runs the sync. The settings merges of migrate and upgrade leave the owned patterns to it.
- **`specfold doctor`, new check D8:** warns when the rendered rules are out of date and fails when the setting is invalid.
- **`AGENTS.md` (template and kit):** the managed block gets one fixed sentence. Before an action set to `ask` under `permissions` in `specfold.yaml`, the agent asks the user, and it never takes an action set to `deny`. The sentence "each feature ends with a PR" now says that opening the PR follows those permissions.
- **Kit repo:** its own `specfold.yaml` sets `ask` for every action, and its `.claude/settings.json` is synced.

This follows [tool-neutral first](/decisions/tool-neutral-first.md): the `AGENTS.md` rule is the contract every tool reads, and Claude Code's permission rules enforce it on top. It extends how the kit already manages `.claude/settings.json` ([upgrade file classes](/decisions/upgrade-file-classes.md), [managed blocks](/decisions/managed-blocks.md)). No rejected decision in `knowledge/decisions/` covers this idea.

## Capabilities

### New Capabilities
- `specfold-permissions`: the `permissions` setting, its validation, and `specfold permissions sync`, which renders it into Claude Code's settings.

### Modified Capabilities
- `specfold-init`: the setup steps run the permissions sync.
- `specfold-migrate`: the Claude settings merge leaves owned patterns alone, and install runs the sync.
- `specfold-upgrade`: the managed settings keys leave owned patterns to the sync, and the follow-up commands run it.
- `specfold-doctor`: check D8, and the command runs D1 to D8.

## Out of scope

- Renderers for OpenCode, Codex, Cursor or other tools.
- Release and package-publish actions, and raw custom patterns.
- A gate rule for permission drift, and writing to `.claude/settings.local.json`.
- Closing every bypass, such as scripts, `git -C` or aliases.

## Impact

- Code:
  - a new `tools/specfold/src/permissions/` module, with command routing
  - `src/init/`, `src/migrate/install.ts`, `src/upgrade/config.ts` and `plan.ts`, `src/doctor/`
  - the bundle
- Template and kit: `specfold.yaml`, `AGENTS.md` and `.claude/settings.json` in both `template/` and the root, and the upgrade notes for the next release.
- Docs: `docs/commands.md` (generated) and `docs/getting-started.md`.
- Knowledge:
  - a new decision and a new capability card
  - the `specfold-init`, `specfold-migrate`, `specfold-upgrade` and `specfold-doctor` cards
  - `/references/claude-code.md`
  - the backlog item
