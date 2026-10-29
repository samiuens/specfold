# Specfold upgrade: 0.1.0 to 0.2.0

## Conflicts (0)

None.

## Changes

| Path | Action |
| --- | --- |
| `.agents/skills/sf-migrate/SKILL.md` | replace |
| `scripts/specfold.mjs` | replace |

## Kept

None.

## Migrations

None.

## Follow-up commands

| Command | Exit | Last line |
| --- | --- | --- |
| `openspec update` | -1 | could not run: spawnSync openspec ENOENT |
| `specfold agents sync` | 0 | agents sync: links are up to date, 0 kept |
| `specfold hooks install` | 2 | specfold: specfold.yaml is in a subfolder of the git repository /Users/smi/Development/specfold; hooks are installed from the git root, because core.hooksPath applies to the whole repository |
| `specfold index` | 0 | 11 indexes, 0 written: 0 errors, 0 warnings |
| `specfold validate` | 0 | 21 files checked: 0 errors, 0 warnings |
| `specfold gate --base bd1520f8f2463151605596c2981458ba71287fe5 --local` | 0 | gate: passed, 1 warning |

## Upgrade notes

### 0.2.0

This release adds `specfold gate require`, which makes the `specfold-gate` check required on the default branch. Until the check is required, the gate only reports, and a failing gate blocks no merge.

After the upgrade PR is merged, ask the user whether to make the gate a required check, recommending yes. On a yes, run from the repository root:

```sh
node scripts/specfold.mjs gate require --dry-run
node scripts/specfold.mjs gate require
```

The first command shows whether it would create or update the ruleset `specfold-gate`; the second sets it. It needs a `gh` login with admin rights on the repository, and GitHub offers rulesets for private repositories only on its paid plans. If it exits with 2, pass on the reason and the manual steps it prints. A repository that already requires the check through its own rules can skip this; `node scripts/specfold.mjs doctor` reports the state as check D7.
