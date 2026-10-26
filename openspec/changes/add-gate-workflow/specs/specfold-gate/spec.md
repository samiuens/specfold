## ADDED Requirements

### Requirement: Gate summary
With `--summary <file>`, the gate SHALL also write a Markdown summary to that file: a heading with the verdict, one table with rule, effect, path, message and fix for every finding in output order (left out when there are none), and a line with the number of warnings per rule. The summary SHALL be written whether or not the gate blocks.

#### Scenario: Summary of a blocked branch
- **WHEN** G4 blocks, G12 warns twice and `--summary summary.md` is set
- **THEN** `summary.md` starts with a heading naming G4, has one table row per finding with `|` in messages escaped, and ends with `Warnings: G12 2`
