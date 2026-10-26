# Proposal

## Why

All items currently look equally important, so the list cannot answer "what matters most?". A small set of named priority levels, which can be changed later and used as a filter, covers that with a minimal API change. The decisions are in `brief.md`.

## What Changes

- Items carry a `priority`: one of `"low"`, `"normal"`, `"high"`.
- `add(title, { priority })` accepts an optional priority; without one, the item gets `"normal"`.
- New `setPriority(id, priority)` changes an item's priority, done items included.
- `list({ priority })` filters by priority and combines with the existing `done` filter.
- An unknown priority throws a `TypeError` everywhere; an unknown id in `setPriority` throws a `RangeError`.

No knowledge concept covers priorities yet, and no rejected decision in `knowledge/decisions/` covers the idea. Following [Due dates are calendar strings](/decisions/dates-as-calendar-strings.md), values are plain strings that read well in tests and specs.

## Capabilities

### New Capabilities
- `priorities`: priority levels on to-do items, changing them, and filtering by them.

### Modified Capabilities
- none

## Impact

- `src/todo.js` and its tests. `add`, `complete`, `list` and `overdue` keep their behavior; items gain the `priority` field, so the existing exact-match test in `test/todo.test.js` changes.
