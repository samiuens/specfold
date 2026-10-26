# Proposal

## Why

A typo in a title can only be fixed by adding the item again, which loses its id and due date. The backlog item [Rename an item](/backlog/rename-an-item.md) asked for a rename; the decisions are in `brief.md`.

## What Changes

- New `rename(id, title)` changes an item's title and returns the updated item.
- The title follows the rules of `add`: it is trimmed, and an empty or non-string title throws a `TypeError`.
- Done items can be renamed; `done` and `due` stay as they are.
- An unknown id throws a `RangeError`, like `complete(id)`.

No knowledge concept covers renaming yet, and no rejected decision in `knowledge/decisions/` covers the idea.

## Capabilities

### New Capabilities
- `rename`: changing the title of an existing to-do item.

### Modified Capabilities
- none

## Impact

- `src/todo.js` and a new test file. `add`, `complete`, `list` and `overdue` keep their behavior.
