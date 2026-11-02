## MODIFIED Requirements

### Requirement: Code references
The command SHALL scan files matching `source_globs` in `specfold.yaml` for `see knowledge: <path>` (bundle-absolute path to a `.md` file, optionally followed by ` - <label>`), where further paths may follow the first, each after a comma, and list each referenced path under its concept's entry as `  * Referenced from code: <repo-relative path>:<line>`, sorted by path and line.

#### Scenario: Reference listed
- **WHEN** `src/checkout.ts` line 12 contains `// see knowledge: /decisions/guest-orders.md`
- **THEN** the entry for `guest-orders.md` in `decisions/index.md` has a nested line `  * Referenced from code: src/checkout.ts:12`

#### Scenario: Reference to a missing concept
- **WHEN** a source file references `/decisions/missing.md`
- **THEN** the command reports a warning with the source location and the exit code is unaffected

#### Scenario: Several paths in one pointer
- **WHEN** `src/checkout.ts` line 12 contains `// see knowledge: /decisions/guest-orders.md, /domain/guest.md - guests`
- **THEN** the entries for both `guest-orders.md` and `guest.md` have a nested line `  * Referenced from code: src/checkout.ts:12`
