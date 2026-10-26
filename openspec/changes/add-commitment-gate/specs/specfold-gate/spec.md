## MODIFIED Requirements

### Requirement: G7 human claims match the PR
With `--pr <number>`, the gate SHALL read the pull request's author and reviews from the GitHub REST API and block with rule `G7` for every `human:<login>` that the diff adds to a concept's `verified` or `committed_by` or a brief's `confirmed_by`, unless the login is the PR author or a reviewer whose latest review, ignoring `COMMENTED` reviews, is `APPROVED`. Logins SHALL be compared case-insensitively.

#### Scenario: Approver verified
- **WHEN** a PR by `ana` adds `verified: { by: human:ben, ... }` and `ben`'s latest review is `APPROVED`
- **THEN** no `G7` finding is reported

#### Scenario: Claimed stranger
- **WHEN** a PR by `ana` adds `confirmed_by: human:carl` and `carl` has not approved
- **THEN** a blocking `G7` finding names `carl` and the file

#### Scenario: Approval withdrawn
- **WHEN** `ben` first approved and later requested changes
- **THEN** `ben` does not count as an approver

#### Scenario: Comment after approval
- **WHEN** `ben` first approved and later left a review with state `COMMENTED`
- **THEN** `ben` still counts as an approver


#### Scenario: Commitment claimed for someone else
- **WHEN** a PR by `ana` adds a commitment with `committed_by: human:carl` and `carl` has not approved
- **THEN** a blocking `G7` finding names `carl` and the file

## ADDED Requirements

### Requirement: G17 design treats open commitments
For every active change the diff touches that has a `design.md`, the gate SHALL warn with rule `G17` when the design's `## Commitments` section lists a commitment as `blocked`, when it links to a commitment that does not exist or is not `open`, and when the section is missing while the bundle holds at least one open commitment.

#### Scenario: Blocked commitment
- **WHEN** a touched change's design lists `- [EU hosting](/commitments/eu-hosting.md): blocked: needs a US-only queue`
- **THEN** a `G17` warning names the change and the commitment

#### Scenario: Section missing
- **WHEN** the bundle has an open commitment and a touched change's `design.md` has no `## Commitments` section
- **THEN** a `G17` warning names the design file

#### Scenario: All kept
- **WHEN** every listed commitment is open and marked `kept`
- **THEN** no `G17` finding is reported for the change

### Requirement: G17 withdrawal signed by a human
The gate SHALL block with rule `G17` for every `Deferred Commitment` whose `state` the diff changes to `withdrawn` unless the diff also adds a `verified` entry with a `human:` actor to that concept.

#### Scenario: Withdrawn by hand
- **WHEN** a PR changes a commitment to `state: withdrawn` with a `reason` but adds no `verified` entry
- **THEN** a blocking `G17` finding names the commitment

#### Scenario: Withdrawn with the command
- **WHEN** a PR carries the result of `specfold commitments withdraw`, which adds `verified: { by: human:ana, ... }`
- **THEN** no `G17` finding is reported, and G7 checks `ana` against the PR
