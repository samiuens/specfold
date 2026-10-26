# Design

## Context

`src/sync/frontmatter.ts` edits frontmatter line by line, so untouched keys, comments and flow collections keep their text. `isoWithOffset` (`src/new/command.ts`) renders timestamps with the local offset. Validation already accepts `verified` as one mapping or a list of mappings (P rules in `src/validate/profile.ts`).

## Goals / Non-Goals

**Goals:** one command a human runs after reviewing concepts; all-or-nothing writes; a guard that keeps agents from running it by accident.

**Non-Goals:** the `/specfold verify` PR comment; proving identity (G7 in CI does that).

## Decisions

- **Frontmatter:** `editFrontmatter` gets `setBlock`: a key mapped to its full lines, which replace the key's range or go right after `generated` when the key is new.
- **Rendering `verified`:** one entry stays a flow mapping like `generated` (`verified: { by: human:ana, at: ... }`); several become a block list of flow mappings. Entries of other logins keep their keys and values; the entry of the same login (compared case-insensitively) is replaced in place.
- **Module `src/verify/`:** `login.ts` (`gh api user --jq .login`, then `actors.github_login` in `.specfold/local.yaml`; a login must match GitHub's login pattern), `apply.ts` (pure: concept text, login and time in, new text out), `command.ts`.
- **Seams for tests:** the GitHub CLI call and the terminal check live on an exported `system` object, so tests replace them with `vi.spyOn`; in-process tests have no terminal on stdin.
- **Order:** usage, then the agent guard (exit 2), then the login (exit 2), then every path (exit 1 with all refusals, nothing written), then the writes.
- **Paths:** tried as repository-relative first, then bundle-relative; the result must be a concept file inside the bundle (`index.md` and `log.md` are not concepts), parse, and not be deprecated. A concept already `stable` stays `stable`.
- **Template:** a new `template/.gitignore` lists `.specfold/local.yaml`.

## Risks / Trade-offs

- [npm publishing drops files named `.gitignore`] → the installer (M8) ships it under another name or writes it; noted for M8.
- [The guard is easy to bypass] → accepted: it only prevents accidents; G7 blocks claims that don't match the PR.
