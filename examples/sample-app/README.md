# Sample app

A worked example of the Specfold workflow in a fresh repository: a tiny to-do library (plain Node.js, no dependencies) set up from the kit's `template/`, with one change, `add-due-dates`, taken through brief, proposal, specs, knowledge, tasks, apply, archive and sync.

Where to look:

- `openspec/changes/archive/*-add-due-dates/`: the change, including the confirmed `brief.md`, `knowledge.md` and the task breakdown in `tasks.md`.
- `openspec/specs/due-dates/spec.md`: the behavior contract the change added.
- `knowledge/`: the capability card and decision the change wrote, linked by `specfold sync`.

Run from this folder (OpenSpec comes from the kit, two levels up):

```sh
npm test
node scripts/specfold.mjs validate
../../node_modules/.bin/openspec validate --all --strict
```

Everything the kit ships is a copy of the kit's `template/`, and the kit's CI fails when one drifts: `AGENTS.md`, `CLAUDE.md`, `scripts/specfold.mjs`, the `specfold` schema, the sf skills and their links, the planner agent and the code-comment convention.

## Agent check (Claude Code and opencode)

This proves the agent layer in a clean repository. Claude Code loads `CLAUDE.md` files and skills from parent folders, so the check runs on a copy outside the kit. Replace `<kit>` with the path of your kit checkout. The commands work in sh, bash, zsh and fish.

### Set up a fresh copy

```sh
rm -rf /tmp/specfold-sample
cp -R <kit>/examples/sample-app /tmp/specfold-sample
cd /tmp/specfold-sample
git init -q && git add -A && git commit -qm "start from the sample app"
node scripts/specfold.mjs doctor
```

`doctor` reports OpenSpec as missing unless it is installed globally. The commands below put the kit's pinned copy on the `PATH` instead.

### Claude Code: plan a change with the planner

```sh
env PATH="<kit>/node_modules/.bin:$PATH" claude --agent planner --permission-mode plan
```

Tell it what you want, for example "Items should have a priority". Then check that:

1. it looks things up before asking (`specfold lookup`, `openspec list --specs`);
2. every question comes as a native multiple-choice question, one decision each, with the recommended option first;
3. it presents the plan through plan approval and writes nothing before you approve;
4. after approval it writes `brief.md` with your `human:<login>` and the other artifacts, and `change check` passes.

Then check and copy the change back into the kit:

```sh
node scripts/specfold.mjs change check <change>
env PATH="<kit>/node_modules/.bin:$PATH" openspec validate <change> --strict
cp -R openspec/changes/<change> <kit>/examples/sample-app/openspec/changes/
```

### opencode: skills from .agents/skills

```sh
cd /tmp/specfold-sample
env PATH="<kit>/node_modules/.bin:$PATH" opencode
```

Ask "Which skills can you load?" The six `sf-*` skills should be listed; note whether any appears twice, since opencode reads both `.agents/skills/` and `.claude/skills/`. Then ask "Use sf-lookup: why are due dates strings?" It should run `node scripts/specfold.mjs lookup` and answer from `decisions/dates-as-calendar-strings.md`.

## Quality loops check (trace, drift, backlog)

Run in `examples/sample-app` (or a fresh copy) after a change to the trace, drift, backlog or retro parts of the kit.

```sh
node scripts/specfold.mjs trace
node scripts/specfold.mjs drift
node scripts/specfold.mjs backlog list --state all
node scripts/specfold.mjs lookup rename
```

Check that:

1. `trace` shows no dangling reference, and every scenario under `openspec/specs/` has a test; the only uncovered scenarios belong to the planned `add-priorities` change;
2. `drift` names `decisions/dates-as-calendar-strings.md`, because `src/todo.js` references it and changed in `add-rename` after the decision was written;
3. the backlog shows `rename-an-item` as promoted to `add-rename`, and `change-a-due-date` as open (it was put out of scope in that change's interview);
4. `log.md` has the `Retro` entry of `add-rename`.

To repeat the promotion on a fresh copy: `node scripts/specfold.mjs backlog add "<title>" --origin human`, then `env PATH="<kit>/node_modules/.bin:$PATH" node scripts/specfold.mjs backlog promote <item> --name <change>`, and plan the change with the planner as above.


## Token numbers

Measured on 2026-10-28 on a scratch copy of this folder with graphify 0.9.97; nothing of graphify is committed here, because the sample app's kit files come only from kit releases. Estimates from `node scripts/specfold.mjs stats` (characters / 4):

| Always-loaded item | Before setup | After `graphify setup` |
| --- | --- | --- |
| `AGENTS.md` | 867 | 867 |
| `CLAUDE.md` | 155 | 155 |
| `openspec/config.yaml` context | 126 | 126 |
| 7 `sf-*` skill descriptions | 373 | 373 |
| `graphify` skill description | – | 91 |
| SessionStart hook output | 208 | 208 |
| **Total** (budget 4000) | **1729** | **1820** |

`graphify setup` took about 4 seconds, changed five things (skill, link, `.graphifyignore`, the guard in `.claude/settings.json`, the code-only graph) and reported "everything is up to date" on a second run. The skill costs 91 tokens in every session; its guard adds a short hint only when a search or read runs.

The task run with and without graphify is not recorded yet: the app has 164 lines of code, where the graph can save little. It is the backlog item `/backlog/measure-a-task-run-with-and-without-graphify.md` in the kit.

## Upgrade runs

The sample app gets its kit files only by upgrading from each release, with the released upgrader (see the kit's runbook "Upgrade the sample app"). Each run is one commit by the upgrader on `specfold/upgrade-<version>`, plus its record here. `.specfold/upgrade-report.md` holds the last run's report.

### 0.1.0-rc.1 to 0.1.0-rc.2 (2026-10-28)

- **How:** rc.1 has no `upgrade` command, so the rc.2 CLI ran from its tarball, with the rc.1 tarball as the merge base, as the rc.2 upgrade notes describe. Both tarballs passed their checksums.
- **Result:** no conflicts, exit 0. The upgrade:
  - added the `sf-upgrade` skill with its link and the two gate workflows;
  - replaced the CLI bundle;
  - added the `rules.design` key to `openspec/config.yaml`, which the sample app had been missing;
  - moved `kit_version` and the manifest to rc.2.

  `npm test`, `validate`, `index --check`, `openspec validate --all --strict` and `agents sync --check` pass.
- **Expected follow-up failures:**
  - `openspec update` could not run, because OpenSpec is installed at the kit root, not on the PATH or in the sample app;
  - `hooks install` exited with 2, because the sample app is nested inside the kit's git repository.
- **Upgrader bugs found:**
  - the `gate --local` follow-up exited with 2 because it passed no `--base`;
  - merging `openspec/config.yaml` rewrapped its long list items at 80 characters. The content is equal, but the formatting changed.

  Both get fixed in the kit before rc.3. This commit is left exactly as the rc.2 upgrader made it.
