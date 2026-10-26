# Design

## Context

Rule L2 (`src/validate/links.ts`) resolves `resource` and `sources[].resource` against the bundle. `scanReferences` (`src/indexes/refs.ts`) finds `see knowledge:` comments in `source_globs` files. Lookup computes its trust flags from frontmatter alone (`src/lookup/search.ts`). The gate has the changed files of the branch (`GateDiff.files`), and `gate.block_on_drift` is already in the kit's `specfold.yaml` but nothing reads it.

## Goals / Non-Goals

**Goals:** one function that finds a concept's dependent paths and one that decides whether it drifted, shared by `drift`, lookup and G16; git as the only source of time.

**Non-Goals:** uncommitted work; judging whether a code change matters to the concept's content.

## Decisions

- **Module `src/drift/`:**
  - `deps.ts` maps every concept to its dependent repository paths;
  - `drift.ts` computes baselines and triggering commits;
  - `command.ts` prints them.
- **Dependent paths:**
  - `resource` and `sources[].resource` values without a URL scheme resolve like L2 (a leading `/` is bundle-absolute, anything else is relative to the concept file), and count only when the result exists inside the repository;
  - a `#fragment` is dropped;
  - folders stay folders, because git pathspecs already match every file below them;
  - code references come from `scanReferences` with `source_globs`.
- **Baseline:** the later of the latest `verified[].at` (else `generated.at`) and `git log -1 --format=%cI -- <concept file>`. A concept with neither has no baseline and is never reported.
- **Triggering commits:** one `git log --name-only --format=<marker>%h%x09%cI%x09%s --since=<baseline> -- <paths>` per concept. Commits whose committer date is not strictly after the baseline are dropped, because `--since` works at second granularity and is inclusive. Each commit keeps only the paths that are dependent paths of the concept.
- **`drift [<path>...]`:** arguments resolve repository-relative first, then bundle-relative, like `verify`; one that is not a concept is a usage error. Outside a git repository the command is an environment error.
- **Lookup:** the command computes `drift` only for the results it prints, after `--limit`, and inserts it before `unverified`. It loads `specfold.yaml` when there is one, for `source_globs`; without a git repository it skips the flag.
- **G16:** the inverted map (dependent path to concepts) is matched against `GateDiff.files`; a changed file under a folder dependency counts too. A concept counts as touched when its own file is in the diff. The effect comes from `Config.gate.blockOnDrift`, read from `gate.block_on_drift` (default false).

## Risks / Trade-offs

- [Concepts that cite `docs/plan.md` drift whenever the plan changes] → intended: the plan is what they summarize.
- [One git call per concept makes `drift` slower on big bundles] → acceptable for a report; lookup only pays for its results.
- [Rebases rewrite committer dates] → a rebase can only make a concept look staler, never fresher; re-verifying or editing the concept clears it.
