## MODIFIED Requirements

### Requirement: Trust flags
Each result SHALL carry the flags that apply, in this order: `deprecated` when `status` is `deprecated`, `stale` when `stale_after` is before the current time, `drift` when the concept is possibly stale by the rules of `specfold drift`, `unverified` when there is no `verified` entry. Outside a git repository, the `drift` flag SHALL be left out.

#### Scenario: Stale and unverified
- **WHEN** a matching concept has `stale_after: 2020-01-01T00:00:00Z` and no `verified`
- **THEN** its result carries the flags `stale` and `unverified`

#### Scenario: Code changed after verification
- **WHEN** a matching, verified concept's dependent file was committed after its baseline
- **THEN** its result carries the flag `drift`
