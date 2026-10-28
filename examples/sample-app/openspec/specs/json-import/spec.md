# json-import Specification

## Purpose
Reads to-do entries from JSON text and checks them with the same rules as adding an item, so the caller can add them to a list.

## Requirements

### Requirement: Entries imported from JSON
`fromJson(text)` SHALL parse `text` as a JSON array of entries `{ title, done?, due? }` and return one entry `{ title, done, due }` per array element, in order. `title` SHALL have surrounding whitespace removed, `done` SHALL be `false` when not given, and `due` SHALL be `null` when not given. Imported entries SHALL NOT be added to any list.

#### Scenario: Valid entries
- **WHEN** `fromJson('[{"title":" Pay rent ","due":"2026-11-01"},{"title":"Call mom","done":true}]')` is called
- **THEN** it returns `[{ title: "Pay rent", done: false, due: "2026-11-01" }, { title: "Call mom", done: true, due: null }]`

### Requirement: Text that is not a JSON array rejected
`fromJson` SHALL throw a `TypeError` when `text` is not a JSON array, and SHALL return no entries.

#### Scenario: Not an array
- **WHEN** `fromJson('{"title":"Pay rent"}')` is called
- **THEN** a `TypeError` is thrown

#### Scenario: Non-JSON text
- **WHEN** `fromJson("not json")` is called
- **THEN** a `TypeError` is thrown

### Requirement: Invalid entry rejected with its index
`fromJson` SHALL throw a `TypeError` whose message starts with `entry <index>:`, the entry's array index counted from 0, when an entry's `title` is not a string or is empty after trimming, or when its `due` is given and is not a real `YYYY-MM-DD` calendar date, checked as `add` checks it. No entries SHALL be returned.

#### Scenario: Empty title names its index
- **WHEN** `fromJson('[{"title":"Pay rent"},{"title":"  "}]')` is called
- **THEN** a `TypeError` is thrown whose message starts with `entry 1:`

#### Scenario: Non-string title names its index
- **WHEN** `fromJson('[{"title":42}]')` is called
- **THEN** a `TypeError` is thrown whose message starts with `entry 0:`

#### Scenario: Invalid due date names its index
- **WHEN** `fromJson('[{"title":"Pay rent"},{"title":"Call mom"},{"title":"Read","due":"2026-02-30"}]')` is called
- **THEN** a `TypeError` is thrown whose message starts with `entry 2:`

### Requirement: Non-boolean done rejected
When an entry's `done` is given and is not a boolean, `fromJson` SHALL throw a `TypeError` with the message `entry <index>: done must be true or false`, the entry's array index counted from 0. No entries SHALL be returned.

#### Scenario: Non-boolean done names its index
- **WHEN** `fromJson('[{"title":"Pay rent","done":"yes"}]')` is called
- **THEN** a `TypeError` is thrown with the message `entry 0: done must be true or false`
