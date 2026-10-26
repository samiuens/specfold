# Design

## Context

`lookup` is the first step of the lookup order in `AGENTS.md`. It reads only frontmatter, through the existing bundle walk and parser, and writes nothing.

## Goals / Non-Goals

**Goals:**
- `specfold lookup` as specified: deterministic ranking and trust flags, in one line per hit.

**Non-Goals:**
- Body search.
- Vision and commitment injection, and drift flags (M5).

## Decisions

**Confirmed open points:**
- Word-prefix matching.
- Repository-relative paths.
- No hits exits with 0.
- `--limit` defaults to 10.
- No `specfold.yaml` is needed.

**Tokenizing:** text and query are split with the same rule, on `[^\p{L}\p{N}]+` and lowercased, so `okf_version` and `OKF-version` produce the same words.

**Fields:**
- `title`, `description`, `type` as strings.
- `tags` as a list of strings, or a single string.
- A concept without a usable `title` is searched by its file name, and its result shows that name.

**Time:** "stale" compares `stale_after` with the current time when the command runs. Tests use dates far in the past and future instead of a fake clock.

**Module:** `src/lookup/search.ts` holds the pure search over parsed concepts; `src/lookup/command.ts` holds arguments and output.

## Risks / Trade-offs

- Short query words match many concepts through prefix matching (`a` matches almost everything). The ranking and `--limit` keep the output short, and agents should use meaningful words.
