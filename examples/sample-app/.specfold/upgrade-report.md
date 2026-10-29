# Specfold upgrade: 0.2.0 to 0.2.1

## Conflicts (0)

None.

## Changes

| Path | Action |
| --- | --- |
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
| `specfold gate --base c1b1fc3b5b95c54ca8f5dcfa85b8b78c3062d385 --local` | 0 | gate: passed, 1 warning |

## Upgrade notes

No manual steps.
