# Design

## Context

The bundle walk and frontmatter parser (`src/bundle.ts`), the body link parser of rule L1 (`src/validate/links.ts`), the timestamp check (`isTimestamp`) and the code reference scan (`src/indexes/refs.ts`) already exist.

## Goals / Non-Goals

**Goals:** one pass over the bundle that parses each concept once and feeds all five rules; the current time is injected so tests are deterministic.

**Non-Goals:** fixing findings (the `sf-audit` skill proposes fixes); checks that `specfold validate` already blocks.

## Decisions

- **Refactor:** the link extraction inside L1 becomes an exported `bodyLinks(file, bundleRoot)` that returns each link's target, resolved path and line, skipping fenced code and inline code as L1 does. L1 keeps its behavior.
- **Module `src/audit/`:** `rules.ts` (A1-A5 over parsed concepts, `now` as a parameter) and `command.ts`.
- **Findings** use the existing `Finding` shape (`path` bundle-relative for concepts, repository-relative for specs) with severity `warning`.
- **Incoming links for A4** come from concept bodies only, excluding a concept's links to itself; `index.md` and `log.md` are not concepts, so they never count.

## Risks / Trade-offs

- [A4 can flag concepts reachable only through frontmatter `sources`] → acceptable: sources point outward, not between concepts; the finding asks for a link from a related concept.
