# Design

## Context

`specfold validate` (archived change `2026-10-26-add-specfold-validate`) established the CLI core: argument parsing, the command registry, repository and config discovery, findings, and the bundle walk with frontmatter parsing. `specfold index` reuses all of it. Until now the kit's own indexes were written by hand. This change replaces them with generated ones.

## Goals / Non-Goals

**Goals:**
- `specfold index` and `specfold index --check` as specified, byte-deterministic so golden files and the gate (G2) can compare them.
- A small glob matcher without dependencies, shared later by `tasks check` (file ownership) and the gate (source globs).
- The kit's own indexes generated and checked in CI.

**Non-Goals:**
- `log.md` (`specfold log add`).
- Blocking on code references to missing or deprecated concepts (gate rule G14).

## Decisions

**Accepted open points** (from the proposal's first draft, accepted as proposed):
1. Folder titles and descriptions come from the optional `specfold.yaml` key `folders.<path>.{title, description}`, where `<path>` is relative to the bundle root, for example `decisions` or `domain/payments`. Without an entry, the title is derived from the folder name and there is no description.
2. Subfolders are listed first, under `# Sections`. The root index ends with `# Log` when `log.md` exists.
3. Deprecated concepts stay listed, with ` (deprecated)` after the link.
4. Code references are nested entries: `  * Referenced from code: <path>:<line>`.
5. Index files are fully generated, and hand edits are replaced.
6. Unparseable concepts are skipped and reported; all other indexes are still written, and the exit code is 1.

**Finding rule ids:**
- `I1` (error): a concept whose frontmatter cannot be parsed, left out of the index.
- `I2` (warning): a `see knowledge:` reference to a concept that does not exist.
- Findings use the same shape as `validate`; `path` is relative to the repository root.

**What counts as written:** `written` lists only indexes that were created or whose content changed, so a second run reports nothing and changes nothing.

**Human output:**
- Write mode prints one `wrote <path>` line per written index, then a summary.
- `--check` prints one `outdated <path>` line per missing or differing index, then a summary.
- Error findings are printed as in `validate`.

**Module layout:**

| Module | Responsibility |
| --- | --- |
| `src/glob.ts` | glob to RegExp (`**`, `*`, `?`, `{a,b}`), path matching, repository file walk |
| `src/indexes/generate.ts` | builds the expected content of every index from the bundle tree and frontmatter |
| `src/indexes/refs.ts` | scans files matching `source_globs` for `see knowledge:` references |
| `src/indexes/command.ts` | the `index` command: write or check, output, exit codes |

**Glob semantics:**
- `**` matches zero or more path segments, `*` and `?` stay within one segment, and braces expand alternatives.
- `**` matching zero segments avoids lefthook's default-matcher trap, where `knowledge/**/*.md` does not match `knowledge/index.md` (`/references/git-hooks.md`).
- The source scan skips `.git`, `node_modules` and folders starting with a dot, as well as files over 1 MB or containing NUL bytes.

**Reference syntax:** `see knowledge: </bundle-absolute/path.md>`, optionally followed by ` - <label>`, in any comment style. Only paths starting with `/` and ending in `.md` count, so the CLI's own regex source in the bundle never matches itself.

## Risks / Trade-offs

- **Root order changes:** generated root sections are sorted by folder name. The kit's root index loses its hand-picked order; folder titles and descriptions move into `specfold.yaml`.
- **Large repositories:** the source scan reads every file matching `source_globs`. That is acceptable for M1; the gate can later limit the scan to changed files.
