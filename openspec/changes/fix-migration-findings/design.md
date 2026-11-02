# Design

## Context

See proposal.md - Why. Most fixes are local to one module. Two need a technical choice: B9 (editing YAML without reformatting it) and B3 (the reference pattern that five other commands share).

## Goals / Non-Goals

- Goal: every bug fix comes with a test that fails before the fix.
- Non-goal: quieter hooks during an active migration. That is part of the [deferred commitment](/commitments/migrate-an-existing-okf-bundle.md) for the existing-bundle path.

## Decisions

### B9: splice text instead of re-serialising the document

`hooks install` keeps parsing `lefthook.yml` and `.pre-commit-config.yaml` with `yaml`'s `parseDocument`, to find where Specfold's entries go and whether they already exist. It no longer writes `doc.toString()`. Instead it inserts the text of its own entries at the source offsets the parsed nodes carry (`node.range`):

- a hook key that is missing: a new top-level block appended at the end of the file;
- an existing block-style `commands` map or `jobs` sequence: the entry's lines after the node's end, indented like its first item;
- pre-commit: a new `repo: local` item after the end of `repos`, or new hooks after the existing Specfold hooks; `default_install_hook_types` is the only node whose text is replaced.

Each entry is rendered as text in the file's detected indentation (taken from the first nested key, default two spaces). The result is re-parsed: if the parse fails, or it doesn't contain the entries, install stops with an error and writes nothing.

Rejected: other `yaml` `toString` options. The library has no mode that keeps flow sequences and folded scalars as written. Also rejected: a text-only append with no parse, which cannot tell whether a hook already holds an entry or uses `jobs`.

When the target collection is written in flow style (`pre-commit: { commands: {...} }`), install falls back to replacing only that node's text, re-serialised. This is rare, and every other line still stays as it was.

### B3: one pattern, a list of paths

`indexes/refs.ts` is the only parser. `audit`, `gate`, `drift`, `sync` and `backlog` all call `scanReferences`, so they pick up the list form automatically. The pattern matches the first path, then repeats `,\s*<path>`. Each path becomes its own `CodeReference` with the same file and line. A label after ` - ` still ends the list.

### B10: summary in the hook, not in the gate

The summary threshold applies only in `claude-stop`. `specfold gate` and the pre-push hook print in full, because a person reads those once, not on every turn. The summary reuses `renderGate`'s verdict line.

### B2: `log add` reuses the index writer

When `log add` creates `log.md`, it calls the same generator `specfold index` uses and writes only the root `index.md`. Subfolder indexes stay untouched.

## Risks / Trade-offs

- [Spliced YAML is wrong for an unusual layout] → re-parse after the edit, fail without writing, and test fixtures with flow lists, folded scalars, comments and `jobs`.
- [Workspace patterns such as `!**/test/**` or `apps/**`] → skip negations; a pattern that ends in `**` becomes `<pattern>` itself rather than `<pattern>/src/**`.
- [`log add` now writes a second file] → only when it creates the log, and the output names both files.
