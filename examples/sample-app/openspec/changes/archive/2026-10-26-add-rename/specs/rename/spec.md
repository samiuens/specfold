## ADDED Requirements

### Requirement: Rename an item
`rename(id, title)` SHALL set the item's title to `title` with surrounding whitespace removed and return the updated item. Its `done` state and `due` date SHALL stay unchanged, also for done items.

#### Scenario: Title changed
- **WHEN** an item "Pay rnet" with `due: "2026-11-01"` is renamed with `rename(id, " Pay rent ")`
- **THEN** the returned item has `title: "Pay rent"` and `due: "2026-11-01"`, and `list()` shows the new title

#### Scenario: Done item renamed
- **WHEN** a done item is renamed
- **THEN** the returned item has the new title and `done: true`

### Requirement: Invalid rename rejected
`rename` SHALL throw a `TypeError` when `title` is not a string or is empty after trimming, and a `RangeError` when no item has `id`. In both cases no item SHALL change.

#### Scenario: Empty title
- **WHEN** `rename(id, "  ")` is called
- **THEN** a `TypeError` is thrown and the item keeps its old title

#### Scenario: Unknown id
- **WHEN** `rename(7, "x")` is called and no item has id 7
- **THEN** a `RangeError` is thrown and `list()` stays unchanged
