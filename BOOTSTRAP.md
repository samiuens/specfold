# Bootstrap Specfold

Paste this whole file into your coding agent, started at the root of the repository that should use Specfold. It works in any agent that can run shell commands.

The kit is fetched as the newest stable release of `samiuens/specfold` over plain HTTPS, with no login: a template tarball checked against its SHA-256.

## Instructions for the agent

Rather ask than assume: whenever a step leaves a decision open, ask the user in your native question UI, one decision per question, recommended option first. A missing or timed-out answer is never consent.

1. **Check.** You are at the root of a git repository (`git rev-parse --show-toplevel`), `curl --version` works and `node --version` is 20 or later. If one fails, tell the user what is missing and stop. Then run `gh auth status`: the install works without it, but if it fails, tell the user that making the gate a required check and opening the migration PR will be manual steps.
2. **Fetch the kit** into a new temporary folder, outside the repository. Run nothing from it yet.

   ```sh
   TAG=$(curl -fsSL https://api.github.com/repos/samiuens/specfold/releases/latest | node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(JSON.parse(s).tag_name))')
   KIT=$(mktemp -d)
   for f in "specfold-template-$TAG.tar.gz" "specfold-template-$TAG.tar.gz.sha256"; do
     curl -fsSL -o "$KIT/$f" "https://github.com/samiuens/specfold/releases/download/$TAG/$f"
   done
   node -e 'const [f, s] = process.argv.slice(1), fs = require("node:fs"), h = require("node:crypto").createHash("sha256").update(fs.readFileSync(f)).digest("hex"); if (h !== fs.readFileSync(s, "utf8").split(" ")[0]) { console.error("checksum mismatch"); process.exit(1); }' "$KIT/specfold-template-$TAG.tar.gz" "$KIT/specfold-template-$TAG.tar.gz.sha256"
   tar -xzf "$KIT/specfold-template-$TAG.tar.gz" -C "$KIT" --strip-components=1
   ```

   If no release is found or the checksum check fails, tell the user and stop. `$KIT/` is now the kit's payload; every later step installs from it.
3. **Choose the path.** List the tracked files with `git ls-files`.
   - **Existing repository** (any tracked file besides `README*`, `LICENSE*` and `.gitignore`): read `$KIT/.agents/skills/sf-migrate/SKILL.md` and follow it from step 0. Its `<kit>` is `$KIT`, and install gets `--ref $TAG`. Do not copy the skill into the repository first: the migration starts on a clean tree, and install copies the skill.
   - **Empty repository** (no commits, or only those files): ask the user for the stack, where the code will live, whether to make the gate a required check on the default branch (recommended; it needs a `gh` login with admin rights), and whether to turn on weekly upgrade PRs, which also need a `SPECFOLD_TOKEN` secret. Copy everything in `$KIT/` except the downloaded `specfold-template-*` files and the `upgrade/` folder, dot files and symlinks included, into the repository root; never overwrite an existing file, and ask the user about each one. Then run `node scripts/specfold.mjs init` with `--stack`, one `--source-glob` per answer, `--require-gate` and `--upgrade-workflow` on a yes. If init reports the required check as skipped, pass on its reason and manual steps. Pass on the secret's setup that init prints, show `git status`, and ask the user before committing.
4. **Stop at every checkpoint.** On the migration path, the plan needs the user's approval before anything is installed, and every install conflict, the push and the PR are the user's call.
5. **Clean up.** When the work is committed, delete `$KIT`.
