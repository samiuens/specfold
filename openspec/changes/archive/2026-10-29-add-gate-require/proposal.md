# Proposal

## Why

The gate is the enforcement ([blocking merge gate](/decisions/blocking-merge-gate.md)), but only once `specfold-gate` is a required check. Today a repository that installs Specfold gets the workflow and a sentence in the guide; until someone changes the branch rules by hand, a failing gate blocks nothing.

## What Changes

- **`specfold gate require [--dry-run] [--json]`:** through `gh`, creates or updates one ruleset named `specfold-gate` on the repository's default branch. It requires the status check `specfold-gate` from GitHub Actions, with no bypass actors and without "branches must be up to date". Other rulesets stay untouched, and a second run changes nothing. Without a gh login, admin rights or rulesets for the repository (a private repository on GitHub Free), it exits 2 with the reason and the manual steps.
- **`specfold init --require-gate`:** runs the same step after setup. When it can't be done, init reports the reason and the manual steps and still exits 0.
- **`specfold doctor`, new check D7:** warns when `specfold-gate` isn't required on the default branch and names `gate require`. It is `ok` with a note when gh is missing or the rules can't be read.
- **Agents:** BOOTSTRAP.md asks whether to make the gate required, recommending yes. sf-migrate's report tells the user to run `gate require` once the migration PR is merged.
- **Docs and upgrade notes:** `docs/getting-started.md` and `docs/commands.md`, and the next release's upgrade notes, which tell the agent to ask the user and run `gate require`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-gate`: the `gate require` subcommand.
- `specfold-init`: the `--require-gate` flag.
- `specfold-doctor`: check D7.

## Out of scope

- GitHub Enterprise Server hosts.
- Classic branch protection.

## Impact

- Code: `tools/specfold/src/gate/` (new require module and command routing), `src/init/`, `src/doctor/`; the bundle.
- Template and kit: `BOOTSTRAP.md`, the sf-migrate skill (template, with the kit's copy), `upgrade/notes/<next version>.md`.
- Docs: `docs/getting-started.md`, `docs/commands.md`.
- Knowledge: `decisions/blocking-merge-gate.md`, the gate, init and doctor capability cards.
