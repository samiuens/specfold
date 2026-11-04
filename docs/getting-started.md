# Getting started

This guide takes a repository from nothing to its first archived change. The whole loop is in [Workflow](workflow.md), and every command in the [command reference](commands.md).

## What you need

- Node.js 20 or later and git.
- curl. The bootstrap downloads the release from `samiuens/specfold` over HTTPS, with no login.
- Optional: `gh`, logged in. With it, init can make the gate a required check and the migration can open its PR; without it, those are manual steps.
- OpenSpec 1.15 or later (`@fission-ai/openspec`), on the PATH or in the repository's `node_modules/.bin`. `specfold init` stops before writing anything when it is missing.
- A coding agent. Claude Code gets the most: subagents, plan mode, hooks and parallel worktrees. Any agent that reads `AGENTS.md` and `.agents/skills/` works, opencode and Codex for example.

## Install

### New or empty repository

Open your coding agent at the repository root and paste the whole of [`BOOTSTRAP.md`](../BOOTSTRAP.md). The agent:

1. checks git, `gh` and Node.js;
2. downloads the newest release's `specfold-template-<version>.tar.gz` into a temporary folder and checks it against its `.sha256`;
3. asks you for the stack, where the code will live, whether to make the gate a required check, and whether to turn on weekly upgrade PRs (see [Upgrading](upgrading.md));
4. copies the kit in, never overwriting a file without asking, and runs `node scripts/specfold.mjs init`;
5. shows `git status` and asks before committing.

To do it by hand, take the same steps: download and check the tarball, unpack it with `tar -xzf <file> --strip-components=1`, leave out its `upgrade/` folder, and run init yourself.

### Existing repository

Paste `BOOTSTRAP.md` as well. When the repository has tracked files, the agent follows the `sf-migrate` skill instead:

1. `specfold migrate start` creates the branch `specfold/migration` and a state file;
2. `migrate inventory` lists your docs, ADRs, agent files and specs, and the agent proposes where each one goes;
3. you approve the mapping plan before anything is installed;
4. `migrate install` copies the kit in. Your text in shared files such as `AGENTS.md` stays, and Specfold's text goes into a marked block;
5. the agent converts your docs into draft concepts in `knowledge/` and opens one PR. Once it is merged, run `node scripts/specfold.mjs gate require` to make the gate a required check.

The migration PR is exempt from the "source change without a spec" rule, since it is the PR that brings Specfold in.

## What init does

`node scripts/specfold.mjs init` finishes the setup and asks nothing; your agent asks you and passes flags.

- **Stack and source globs:** detected, or set with `--stack` and one `--source-glob` per glob. They go into `openspec/config.yaml` and `specfold.yaml`.
- **Agent tools:** `--tools` chooses them. Without Claude Code, its files are left out.
- **OpenSpec skills** and the `/opsx:*` commands, through `openspec init`, which runs only when they are missing.
- **Skill links** from `.agents/skills/` into `.claude/skills/` (`specfold agents sync`).
- **Agent permissions** (`specfold permissions sync`): the levels under `permissions` in `specfold.yaml` become Claude Code rules in `.claude/settings.json` (see below).
- **Git hooks** (`specfold hooks install`): pre-commit checks staged concepts and changes, pre-push runs the local gate, and post-checkout and post-merge refresh the code graph when graphify is set up. If your repository already uses lefthook, husky or pre-commit, init adds the hooks to it.
- **Managed blocks:** Specfold's text in `AGENTS.md`, `CLAUDE.md`, `.gitignore` and the other shared files gets `specfold:start` and `specfold:end` markers. Upgrades rewrite only what is between them.
- **Subagent limit:** sets your personal limit on subagents running at the same time to 3, or to `--max-subagents <n>`. Change it with `specfold parallel set <n>`.
- **Required gate:** with `--require-gate`, makes `specfold-gate` a required check on the default branch (see below).
- **Weekly upgrade PRs:** turned on only with `--upgrade-workflow`.

`--dry-run` shows the values and the steps without writing anything. Running init again is safe: it keeps earlier values and reports "everything is up to date".

## What lands in the repository

| Path | What it is |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md` | agent instructions: ask rather than assume, lookup order, the workflow |
| `knowledge/` | an empty OKF bundle with one folder per section; `index.md` files are generated |
| `openspec/` | the `specfold` schema, `config.yaml`, and empty `specs/` and `changes/` |
| `.agents/skills/` | the `sf-*` skills, linked into `.claude/skills/` |
| `.claude/` | subagents, settings and hooks for Claude Code |
| `.github/workflows/specfold-gate.yml` | the merge gate, plus a workflow that posts its summary as a PR comment |
| `scripts/specfold.mjs` | the CLI, one file with no dependencies |
| `specfold.yaml` | settings: kit version, channel, source, gate rules, budgets |
| `.specfold/manifest.json` | what came from the kit, so upgrades know what they may rewrite |

Commit it all. The gate blocks merges only once `specfold-gate` is a required check on the default branch; until then it only reports. `init --require-gate` sets that up, and so does `node scripts/specfold.mjs gate require` at any later time: it adds a ruleset named `specfold-gate` that requires the check, with no bypass. It needs a `gh` login with admin rights on the repository, and GitHub offers rulesets for private repositories only on its paid plans. When it can't be done, it prints the steps to do it by hand. `specfold doctor` warns while the check isn't required.

## Agent permissions

`permissions` in `specfold.yaml` says which outward-facing actions an agent may take on its own: `push`, `force-push`, `delete-remote-branch`, `push-tags`, `open-pr`, `merge-pr` and `close-pr`. Each is `allow`, `ask` or `deny`; the template sets `ask` for all, and a missing action counts as `ask`. `force-push`, `delete-remote-branch` and `push-tags` must be at least as strict as `push`, because the `push` rule matches them too.

After a change, run `node scripts/specfold.mjs permissions sync` and commit `.claude/settings.json`. The sync owns only the rules it generates and keeps your own rules, hooks and keys; `--check` reports drift, and so does `specfold doctor` (D8). `AGENTS.md` carries the same rule for every other tool. The rules match the usual `git push` and `gh pr` commands, not every way to write them (`git -C . push` slips through), so treat them as a guard rail, not a security boundary.

## The first change

In Claude Code:

1. **Plan:** start `claude --agent planner --permission-mode plan` and say what you want, for example "items should have a due date". The planner looks up knowledge and specs first, then asks every open decision as a multiple-choice question with the recommended option first. When you approve its plan, it writes the change to `openspec/changes/<change>/`: `brief.md` with your confirmation, the proposal, spec deltas, `knowledge.md` and `tasks.md`.
2. **Apply:** in a normal session, ask it to apply the change. The `sf-apply` skill runs one implementer per task group, each in its own worktree, with one commit per task. Follow progress with `specfold status <change>`.
3. **Check:** `specfold change check <change>` and `openspec validate --all --strict`.
4. **Archive and sync:** `/opsx:archive` moves the change into `openspec/changes/archive/` and merges its spec deltas. Then the `sf-sync` skill applies the knowledge delta with `specfold sync <change>`.
5. **PR:** push and open it. `specfold-gate` runs every check on the branch's diff and blocks the merge until the findings are fixed.

In other agents, use the `sf-plan` skill for step 1, and work the task groups one after another.

To see a finished example, look at `examples/sample-app/` in the kit: its `add-due-dates` change went through every step.
