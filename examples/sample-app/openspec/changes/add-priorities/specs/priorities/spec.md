# Spec Delta

## Purpose

Lets to-do items carry one of three named priority levels, change it later and filter the list by it.

## ADDED Requirements

### Requirement: Priority on add
`add(title, options)` SHALL accept an optional `priority` that is one of `"low"`, `"normal"` or `"high"` and return the item with that `priority`. Without `priority`, the item SHALL have `priority: "normal"`.

#### Scenario: Item with priority
- **WHEN** `add("Pay rent", { priority: "high" })` is called
- **THEN** the returned item has `priority: "high"`

#### Scenario: Default priority
- **WHEN** `add("Buy milk")` is called
- **THEN** the returned item has `priority: "normal"`

### Requirement: Invalid priority rejected on add
`add` SHALL throw a `TypeError` when `priority` is given but is not one of `"low"`, `"normal"` or `"high"`, and SHALL not add the item.

#### Scenario: Unknown priority on add
- **WHEN** `add("Pay rent", { priority: "urgent" })` is called
- **THEN** a `TypeError` is thrown and `list()` stays unchanged

### Requirement: Change priority
`setPriority(id, priority)` SHALL set the priority of the item with that id, whether it is open or done, and return the updated item. An unknown id SHALL throw a `RangeError`. A priority that is not `"low"`, `"normal"` or `"high"` SHALL throw a `TypeError` and leave the item unchanged.

#### Scenario: Priority changed
- **WHEN** an item is added without a priority and `setPriority(id, "low")` is called
- **THEN** the returned item and `list()` show `priority: "low"`

#### Scenario: Done item priority changed
- **WHEN** an item is completed and `setPriority(id, "high")` is called
- **THEN** the returned item has `done: true` and `priority: "high"`

#### Scenario: Unknown id
- **WHEN** `setPriority(7, "high")` is called on an empty list
- **THEN** a `RangeError` is thrown

#### Scenario: Unknown priority on change
- **WHEN** an item with priority `"normal"` exists and `setPriority(id, "urgent")` is called
- **THEN** a `TypeError` is thrown and the item keeps `priority: "normal"`

### Requirement: Filter list by priority
`list({ priority })` SHALL return only the items with that priority, in insertion order. Given together with `done`, both filters SHALL apply. A `priority` filter that is not `"low"`, `"normal"` or `"high"` SHALL throw a `TypeError`.

#### Scenario: Filter by priority
- **WHEN** items with priorities `"high"`, `"low"` and `"high"` are added and `list({ priority: "high" })` is called
- **THEN** the first and third items are returned in insertion order

#### Scenario: Combined with done filter
- **WHEN** two `"high"` items exist, one of them done, and `list({ priority: "high", done: false })` is called
- **THEN** only the open `"high"` item is returned

#### Scenario: Unknown priority filter
- **WHEN** `list({ priority: "urgent" })` is called
- **THEN** a `TypeError` is thrown
