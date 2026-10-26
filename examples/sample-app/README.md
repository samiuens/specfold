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
