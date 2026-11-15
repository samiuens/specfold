# Proposal

## Why

omp (oh-my-pi) already loads `AGENTS.md` and the sf skills of a Specfold repository, but nothing else of the agent layer reaches it:
- it skips `.claude/agents/` on purpose, so sf-apply has no roles to dispatch;
- the Claude Code hooks don't run;
- the push and PR rules are not rendered for it;
- agents in it sign their writes `claude-code/`.

[Tool-neutral first](/decisions/tool-neutral-first.md) keeps the workflow itself tool-neutral. This change gives omp the extras Claude Code gets, opt-in per repository, without a second copy of any role or check.

## What Changes

- A new `tools:` setting in `specfold.yaml` lists the agent tools a repository sets up (`agents`, `claude`, `omp`). `specfold init --tools` and `specfold migrate install --tools` accept `omp` and write the list. `omp` is never passed to `openspec init`.
- `specfold agents sync` generates `.omp/agents/<role>.md` from every `.claude/agents/<role>.md` except `planner`. It maps the Claude model aliases to omp model roles, maps effort to thinking level, and translates the tool lists. It also writes the task settings sf-apply needs into `.omp/config.yml`. It owns only the files it generated and the keys it sets.
- `specfold permissions sync` also renders the `permissions` setting as `bash.patterns` rules in `.omp/config.yml` (`ask` becomes `prompt`) and keeps every other rule and key.
- The template ships an omp hook adapter, installed as `.omp/hooks/pre/specfold.ts`. It runs the existing `specfold hook claude-*` subcommands on session start, after edits and when the main session tries to stop. It blocks the stop on gate findings and refuses `git push` and `gh pr` in subagents. The kit owns the file, and it is installed only with the `omp` tool.
- The CLI detects a process started by omp and signs agent-written `generated.by` with `omp/<model>`; `actors.agent_prefix` stays the fallback for every other tool.
- `sf-apply` gains omp dispatch steps: isolated implementer tasks, at most the `specfold parallel show` limit per batch. The template's `AGENTS.md` names the omp entry points and stops hard-coding `claude-code/` in its knowledge rules.
- Upgrades keep the omp files current for repositories that list `omp`.

## Capabilities

### New Capabilities
- `specfold-tools`: the `tools` setting (which agent tools a repository sets up) and how the CLI recognizes the tool it runs under to sign agent writes.

### Modified Capabilities
- `specfold-agents-sync`: generates omp role files and omp task settings when `tools` lists `omp`.
- `specfold-permissions`: renders the permission levels into omp's `bash.patterns`.
- `specfold-hooks`: the shipped omp hook adapter and its subagent push guard.
- `specfold-init`: `--tools` accepts `omp`, writes `tools`, and sets up the omp files.
- `specfold-migrate`: `migrate install --tools` accepts `omp` and writes `tools`.
- `specfold-upgrade`: the omp files are kit-owned and upgraded when `tools` lists `omp`.
- `specfold-verify`: refuses to run under omp as it does under Claude Code.

## Impact

- Code: `tools/specfold/src/{repo.ts,agents/,permissions/,hooks/,init/,migrate/install.ts,upgrade/,new/,backlog/,sync/}`, with tests and fixtures alongside, and the bundle `scripts/specfold.mjs`.
- Template: `template/.omp/hooks/pre/specfold.ts`, `template/specfold.yaml`, `template/AGENTS.md`, `template/.agents/skills/sf-apply/`, `template/.specfold/manifest.json`. The kit runs byte-identical copies of the template skills ([self-hosting](/decisions/self-hosting.md)).
- Knowledge: a new omp reference, plus updates to the [agent layer](/architecture/agent-layer.md) and the capability cards.
- Existing repositories: no change until `omp` is added to `tools`. A missing `tools` key reads as the tools the manifest shows today.
- Related decisions: [deterministic CLI](/decisions/deterministic-cli.md) (the adapter only forwards to CLI subcommands), [agent permissions](/decisions/agent-permissions.md), and [skills symlinked for Claude](/decisions/skills-symlinked-for-claude.md). omp reads `.agents/skills/` directly, so it needs no links. No rejected decision covers support for another agent tool.
