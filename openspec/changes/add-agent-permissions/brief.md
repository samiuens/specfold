## Wish

"Let's start working on the agent permissions" (backlog item `/backlog/agent-permissions-in-specfold-yaml.md`): a project declares once, in `specfold.yaml`, which outward-facing or hard-to-undo actions an agent may take on its own, and Specfold renders that into Claude Code's permission rules and states the same rule in `AGENTS.md` for other tools. On 2026-10-29 an agent pushed a branch and opened a PR on its own because `AGENTS.md` says each feature ends with a PR, while the user wanted to review first.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which tools get rendered permissions? | Claude Code (`.claude/settings.json`) plus a sentence in the `AGENTS.md` block for every other tool; other renderers come later with the read-barriers item | user |
| Q2 | How are actions named? | A fixed set of named actions; the kit maps each to command patterns, users only pick a level | user |
| Q3 | Which actions are in the set? | Git remote: `push`, `force-push`, `delete-remote-branch`, `push-tags`; pull requests: `open-pr`, `merge-pr`, `close-pr` | user |
| Q4 | Levels and default for new repositories | `allow`, `ask` or `deny` per action; the template sets `ask` for all | user |
| Q5 | An action missing from `specfold.yaml` | Counts as `ask`, matching the default | delegated |
| Q6 | Which command writes the rules? | New `specfold permissions sync [--check] [--json]`, also run by `init`, `migrate install` and `upgrade` | user |
| Q7 | Which settings file? | `.claude/settings.json`, committed and team-wide | user |
| Q8 | How does sync tell its rules from the team's? | It owns exactly the patterns it generates for the named actions, places each in `allow`, `ask` or `deny`, and never touches any other rule; upgrade's settings merge leaves those patterns to sync | user |
| Q9 | When is Claude Code rendered? | Only when `agents.targets` includes `.claude/skills`, the same condition graphify setup uses | delegated |
| Q10 | What does `AGENTS.md` say? | One fixed sentence in the managed block: ask before an action set to `ask` under `permissions` in `specfold.yaml`, never do one set to `deny` | user |
| Q11 | A sub-action of `push` (`force-push`, `delete-remote-branch`, `push-tags`) looser than `push` | Invalid: sync and doctor report it, sync writes nothing and exits 1 | user |
| Q12 | How is drift caught? | New doctor check D8 using the sync's check logic; no gate rule | user |
| Q12a | D8's status levels | `warn` when the rendered rules are out of date, `fail` when the `permissions` setting is invalid, `ok` with a note when Claude Code is not a target | delegated |
| Q13 | The "each feature ends with a PR" sentence | Reworded in the template's and the kit's `AGENTS.md`: opening the PR follows the permissions in `specfold.yaml` (by default after asking) | user |
| Q14 | Exact rule strings | Fixed in the design after a check of Claude Code's permission docs; the spec names each action with one example pattern | user |
| Q15 | How far do the rules go against other routes? | The usual `git` and `gh` forms plus `gh api` for merging and closing PRs; knowledge records that prefix rules are best effort and the `AGENTS.md` rule is the contract | user |
| Q16 | The kit repo itself | Dogfooded: `permissions` with `ask` for all in the kit's `specfold.yaml`, synced into its `.claude/settings.json` | user |

## Out of scope

- Renderers for OpenCode, Codex, Cursor or other tools, and a survey of their formats.
- Release and package-publish actions.
- Raw custom patterns in `specfold.yaml`.
- A gate rule for permission drift.
- Writing to `.claude/settings.local.json`.
- Closing every bypass (scripts, `git -C`, aliases).

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-11-04T08:28:46+01:00
