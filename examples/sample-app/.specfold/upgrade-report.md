# Specfold upgrade: 0.1.0-rc.2 to 0.1.0-rc.3

## Conflicts (0)

None.

## Changes

| Path | Action |
| --- | --- |
| `.agents/skills/sf-migrate/SKILL.md` | replace |
| `.specfold/workflows/specfold-upgrade.yml` | add |
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
| `specfold gate --base 385aa76412a75ca4a213b51364f21a7a315ddd5a --local` | 0 | gate: passed, 1 warning |

## Upgrade notes

No manual steps.
