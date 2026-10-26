## ADDED Requirements

### Requirement: G7 human claims match the PR
With `--pr <number>`, the gate SHALL read the pull request's author and reviews from the GitHub REST API and block with rule `G7` for every `human:<login>` that the diff adds to a concept's `verified` or a brief's `confirmed_by`, unless the login is the PR author or a reviewer whose latest review is `APPROVED`.

#### Scenario: Approver verified
- **WHEN** a PR by `ana` adds `verified: { by: human:ben, ... }` and `ben`'s latest review is `APPROVED`
- **THEN** no `G7` finding is reported

#### Scenario: Claimed stranger
- **WHEN** a PR by `ana` adds `confirmed_by: human:carl` and `carl` has not approved
- **THEN** a blocking `G7` finding names `carl` and the file

#### Scenario: Approval withdrawn
- **WHEN** `ben` first approved and later requested changes
- **THEN** `ben` does not count as an approver

### Requirement: G7 GitHub access
The gate SHALL authenticate with `GITHUB_TOKEN`, take the repository from `GITHUB_REPOSITORY` and the API base from `GITHUB_API_URL` (default `https://api.github.com`), and SHALL exit with an environment error when any request fails or the token or repository is missing.

#### Scenario: Missing token
- **WHEN** `specfold gate --base main --pr 7` runs without `GITHUB_TOKEN`
- **THEN** the command exits with 2 and says that `GITHUB_TOKEN` is required for `--pr`

### Requirement: G7 without a PR
Without `--pr`, the gate SHALL warn with rule `G7` once when the diff adds any `human:` claim, saying that the claim is checked in CI.

#### Scenario: Local verification
- **WHEN** a branch adds a `verified` entry and the gate runs with `--local` and no `--pr`
- **THEN** a `G7` warning is reported and no request is made
