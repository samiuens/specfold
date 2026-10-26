# Sample app

A worked example of the Specfold workflow in a fresh repository: a tiny to-do library (plain Node.js, no dependencies) set up from the kit's `template/`, with one change, `add-due-dates`, taken through brief, proposal, specs, knowledge, tasks, apply, archive and sync.

Where to look:

- `openspec/changes/archive/*-add-due-dates/`: the change, including the confirmed `brief.md`, `knowledge.md` and the task breakdown in `tasks.md`.
- `openspec/specs/due-dates/spec.md`: the behavior contract the change added.
- `knowledge/`: the capability card and decision the change wrote, linked by `specfold sync`.

Run from this folder (the kit's bundled CLI and pinned OpenSpec live two levels up):

```sh
npm test
node ../../scripts/specfold.mjs validate
../../node_modules/.bin/openspec validate --all --strict
```

`openspec/schemas/specfold/` and `knowledge/conventions/code-comments.md` are copies of the kit's `template/`; the kit's CI fails when they drift.
