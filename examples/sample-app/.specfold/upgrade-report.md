# Specfold upgrade: 0.1.0-rc.1 to 0.1.0-rc.2

## Conflicts (0)

None.

## Changes

| Path | Action |
| --- | --- |
| `.agents/skills/sf-upgrade/SKILL.md` | add |
| `.github/workflows/specfold-gate-comment.yml` | add |
| `.github/workflows/specfold-gate.yml` | add |
| `scripts/specfold.mjs` | replace |
| `openspec/config.yaml` | merge |

## Kept

None.

## Migrations

None.

## Follow-up commands

| Command | Exit | Last line |
| --- | --- | --- |
| `openspec update` | -1 | could not run: spawnSync openspec ENOENT |
| `specfold agents sync` | 0 | agents sync: 1 change, 0 kept |
| `specfold hooks install` | 2 | specfold: specfold.yaml is in a subfolder of the git repository /Users/smi/Development/specfold; hooks are installed from the git root, because core.hooksPath applies to the whole repository |
| `specfold index` | 0 | 11 indexes, 0 written: 0 errors, 0 warnings |
| `specfold validate` | 0 | 21 files checked: 0 errors, 0 warnings |
| `specfold gate --local` | 2 | Run 'specfold --help' for usage. |

## Upgrade notes

### 0.1.0-rc.2

This release adds `specfold upgrade`. A repository on 0.1.0-rc.1 has no upgrade command yet. Run this release's CLI from its tarball once, from the repository root, on a clean working tree. The rc.1 tarball is the base for merging the kit files you changed:

```sh
KIT=$(mktemp -d)
for v in 0.1.0-rc.1 0.1.0-rc.2; do
  gh release download "v$v" --repo samiuens/specfold --pattern 'specfold-template-*' --dir "$KIT"
  mkdir "$KIT/$v" && tar -xzf "$KIT/specfold-template-v$v.tar.gz" -C "$KIT/$v" --strip-components=1
done
node "$KIT/0.1.0-rc.2/scripts/specfold.mjs" upgrade --from "$KIT/0.1.0-rc.2" --base-dir "$KIT/0.1.0-rc.1" --ref v0.1.0-rc.2
node "$KIT/0.1.0-rc.2/scripts/specfold.mjs" upgrade --from "$KIT/0.1.0-rc.2" --base-dir "$KIT/0.1.0-rc.1" --ref v0.1.0-rc.2 --yes
```

Check both tarballs against their `.sha256` files before unpacking, as `BOOTSTRAP.md` shows. The first command prints the plan; the second applies it on branch `specfold/upgrade-0.1.0-rc.2`. From now on, `node scripts/specfold.mjs upgrade` does all of this, including the checksums.

To have the commit follow your repository's convention, set `upgrade.commit_message` in `specfold.yaml` first.
