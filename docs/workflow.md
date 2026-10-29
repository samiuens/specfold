# Workflow

Every behavior change goes through one loop: **plan, apply, check, archive, sync**. The knowledge bundle explains why and what; the specs say how the software must behave; a change edits both together. Commands are listed in the [command reference](commands.md).

## The two halves

- **Knowledge** (`knowledge/`): one concept per Markdown file with frontmatter. Concepts are decisions, terms, business rules, components, runbooks and the like, in folders by section. Agents write `status: draft`; only humans mark a concept verified (`specfold verify <path>`). Knowledge never holds SHALL or MUST sentences.
- **Specs** (`openspec/specs/`): one folder per capability, with requirements and scenarios. They are the contract that tests cite (`// spec: <capability>#<scenario>`).

Agents look things up in this order: `specfold lookup <words>` for knowledge, then the code graph if one is installed, then `openspec show <spec>`, and raw search last.

## 1. Plan

A change is a folder `openspec/changes/<change>/` with the artifacts of the `specfold` schema:

| Artifact | What it holds |
| --- | --- |
| `brief.md` | the wish, every decision with its answer and source, what is out of scope, and the user's confirmation (`confirmed_by: human:<login>`) |
| `proposal.md` | why, what changes, which capabilities are new or modified |
| `specs/<capability>/spec.md` | the spec deltas: added, modified and removed requirements |
| `design.md` | only when needed: decisions, risks, commitments made for later |
| `knowledge.md` | the knowledge delta: concepts to create, update or deprecate |
| `tasks.md` | task groups, each with its files, dependencies, scenarios and agent |

**The planning interview** comes first. The agent grounds itself in knowledge and specs, then asks every open decision in its native question UI, one decision per question and the recommended option first. Nothing is written before you approve. In Claude Code, run it as `claude --agent planner --permission-mode plan`, and the plan goes through plan approval. Elsewhere, use the `sf-plan` skill.

**Changes without behavior change** (refactors, tooling, docs) set `skip_specs: true` in the change's `.openspec.yaml`. They need no spec deltas, and their brief may be short.

**Task groups** are units of parallel work. Each group owns its files, and no two groups share one. `depends` orders the groups, and `scenarios` names the spec scenarios its tests must cite. `specfold tasks check <change>` checks the breakdown, and warns when a task touches more than `tasks.max_files_per_task` files.

## 2. Apply

The `sf-apply` skill makes the main session an orchestrator:

1. For every group whose dependencies are merged, `specfold tasks packet <change> <n>` prints a self-contained packet: the tasks, the files, the specs and the knowledge to read.
2. An implementer subagent works the packet in its own worktree, with one commit per task and the trailer `Task: <change>#<n>.<m>`.
3. When a task needs a file outside its group, the implementer stops with a split proposal instead of widening its scope. The spec-writer reshapes `tasks.md`, and you decide when the change's scope moves.
4. The orchestrator merges each finished group and regenerates the knowledge indexes.

`specfold status <change>` shows progress per group, and `specfold resume <change>` prints the next open task with its context, for picking up after a break.

In agents without subagents, work the same groups yourself, one after another, with the same packets.

## 3. Check

- `specfold change check <change>`: the brief's confirmation, the knowledge delta and the task breakdown.
- `openspec validate --all --strict`: the specs and deltas.
- In Claude Code, the verifier subagent runs both, plus the tests and the local gate, and ties each finding to a task group, which fixes it.

## 4. Archive and sync

1. **Archive:** `/opsx:archive` (or `openspec archive <change>`) moves the change to `openspec/changes/archive/<date>-<change>/` and merges its deltas into `openspec/specs/`.
2. **Sync:** the `sf-sync` skill runs `specfold sync <change>`, which applies `knowledge.md`. The change's knowledge task group has already written the concepts before archive. Sync points capability cards at the archived spec and change, flags deprecated concepts, creates stubs for any concept still missing, regenerates the indexes and adds a `log.md` entry. The agent fills in any stub and records the retro.

Archive and sync go into the same PR as the code.

## 5. The gate

`specfold gate` runs every check on what a branch changes and gives one verdict. The same rules run in CI (the `specfold-gate` workflow), in the pre-push hook and in Claude Code's stop hook. Among them:

- **source changes need a change:** code matched by `source_globs` passes without one only with the `no-spec` label and a `No-spec reason:` line in the PR body;
- a touched change must pass its change check, and its brief must be confirmed by a human that GitHub confirms is the PR's author or an approving reviewer;
- concepts must validate, links must resolve, indexes must be current, and touched concepts must not be stale;
- new or modified scenarios need a test that cites them;
- code that a concept depends on, changed without touching the concept, is reported as drift;
- the files every agent session loads must stay within their token budgets (`specfold stats`).

Blocking findings fail the check; warnings go into the job summary and one PR comment. `gate` settings in `specfold.yaml` turn some rules up or down.

## Working in parallel

- **Groups of one change** run in parallel up to your personal limit (`specfold parallel show`, `specfold parallel set <n>`). The limit lives in `.claude/settings.local.json` and is never committed.
- **Several changes at once:** `specfold wt plan` shows which active changes may run together because they touch different files. Start one session per change, with `claude --worktree <change>` or `specfold wt new <change>`. `specfold wt setup` gives each worktree its own test ports, and `specfold wt clean` removes merged ones.
- **Large mechanical changes,** such as renames across many files: Claude Code's `/batch`, wrapped in one change with `skip_specs: true`.

## Keeping knowledge alive

- `specfold audit` (skill `sf-audit`): stale, long-unverified and orphaned concepts, links to deprecated ones, specs without a capability card, overdue commitments, old backlog items.
- `specfold drift`: concepts whose code or sources changed after they were last written or verified.
- `specfold trace`: which tests cite which scenarios, and which scenarios have none.
- `specfold backlog`: ideas for later, with `backlog promote` turning one into a change.
- **Retro:** after each change, the agent asks what it should have asked earlier or guessed, and records the answers in `log.md` (`specfold log add --kind Retro`).
- New knowledge outside a change: the `sf-capture` skill (`specfold new <Type> <path>`).
