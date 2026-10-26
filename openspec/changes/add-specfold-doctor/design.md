# Design

## Context

`doctor` is the first command that runs other programs (`openspec`, `git`, `graphify`). Its checks have to be testable without those programs installed in a particular version.

## Goals / Non-Goals

**Goals:**
- `specfold doctor` with checks D1 to D6 as specified, each with a fix hint.
- Checks that are pure functions of an injected environment, so every scenario can be tested.

**Non-Goals:**
- Manifest, version skew and config drift (M9).
- Repairing anything.

## Decisions

**Confirmed open points:**
- A missing OpenSpec fails; missing graphify is `ok` (optional).
- Missing hooks only warn.
- `requires.openspec` uses space-separated comparators, defaulting to `>=1.15 <2`.
- Exit code 1 only on failures.

**Injected environment:** the checks get `{ cwd, nodeVersion, exec(cmd, args, cwd) }`. `exec` returns stdout, or `undefined` when the program is missing or fails. The command passes the real process and `execFileSync` with a 10-second timeout; tests pass fakes.

**Versions:**
- The first `x.y.z` in a program's output is its version.
- Ranges are comparators (`>=`, `>`, `<=`, `<`, `=`, or none for `=`) joined by spaces, and all must hold.
- Missing parts count as 0, so `>=1.15` means `>=1.15.0`.

**Hooks (D4):**
- `ok` when `git config --get core.hooksPath` returns `.specfold/hooks`, or when `lefthook.yml`, `lefthook.yaml`, `.lefthook.yml`, any file in `.husky/`, or `.pre-commit-config.yaml` contains `specfold hook`.
- Outside a git work tree (`git rev-parse --is-inside-work-tree` fails), D4 warns.

**Configuration:** `Config` gains `requires` (string values from `requires:` in `specfold.yaml`).

**Modules:**
- `src/doctor/checks.ts`: D1 to D6, version ranges.
- `src/doctor/command.ts`: the real environment and output.

## Risks / Trade-offs

- **OpenSpec via npx:** in a repo that runs OpenSpec through `npx` instead of installing it on the PATH, D3 fails. That is accurate under the spec, which asks for `openspec` on the PATH. The kit repo itself is such a repo; see the PR notes.
