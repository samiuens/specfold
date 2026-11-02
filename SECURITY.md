# Security policy

## Supported versions

Only the latest release of Specfold gets security fixes. Fixes ship in the next release; upgrade a repository with `node scripts/specfold.mjs upgrade`.

## Reporting a vulnerability

Please do not open a public issue, discussion or pull request for a vulnerability.

Report it privately through GitHub: on the [Security tab](https://github.com/samiuens/specfold/security) of this repository, choose **Report a vulnerability**. Include what is affected (the CLI, the gate workflow, a skill or the template), the version, steps to reproduce, and the impact you expect.

You can expect a first answer within a week. Once a fix is released, the advisory is published and credits you unless you ask otherwise.

## Scope

In scope:

- the CLI (`scripts/specfold.mjs`, source in `tools/specfold/`), including release downloads, checksum checks, upgrades and migrations;
- the GitHub Actions workflows the kit ships, such as `specfold-gate` and `specfold-gate-comment`;
- the git hooks, agent hooks and skills in `template/`.

Out of scope: vulnerabilities in OpenSpec, GitHub Actions or a coding agent itself (report those upstream), and issues that need an attacker who can already push to your repository.
