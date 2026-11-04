# Specfold: agent instructions

Specfold folds an OKF knowledge bundle and OpenSpec into one agent workflow. This repo builds Specfold **with Specfold** (see `/decisions/self-hosting.md`): the kit's own knowledge and specs live at the root, and the payload shipped to user repos lives in `template/`.

## 1. Rather ask than assume

When the request, the knowledge or the specs leave a decision open, or something conflicts with what exists, ask the user before deciding. Use the tool's native question UI (in Claude Code: `AskUserQuestion`), one decision per question, recommended option first. Never treat a missing or timed-out answer as consent.

## 2. Map

| Path | What it is |
| --- | --- |
| `knowledge/` | the kit's own OKF v0.2 bundle: why and what. Start at `knowledge/index.md` |
| `openspec/` | the kit's own specs (`specs/`) and changes (`changes/`): how the CLI and gate must behave |
| `docs/plan.md` | the build brief, milestones M0-M9 |
| `template/` | the payload a user repo receives; it has its own empty bundle |
| `tools/specfold/` | CLI source (TypeScript), tests, fixtures; kit only |
| `scripts/specfold.mjs` | bundled CLI (build output, committed) |
| `examples/` | worked example app; kit only |
| `brand/` | brand kit: logos, colour and type tokens, preview; kit only |
| `specfold.yaml` | the kit repo's own Specfold settings |

Never copy the kit's own knowledge, specs or settings into `template/`.

## 3. Core rule

Specs are the normative behavior contract, knowledge is descriptive context, nothing is written twice. No SHALL/MUST sentences in `knowledge/`.

## 4. Lookup order

1. `node scripts/specfold.mjs lookup <words>` (or the knowledge indexes) for *why and what*; read the 1-3 best concepts and mind the `stale`, `deprecated` and `unverified` flags.
2. `openspec show <spec> --type spec --json --no-scenarios` for *behavior*.
3. Raw grep and file reads last.


## 5. Workflow

Every milestone from M1 on is an OpenSpec change: explore, propose, apply, verify, archive, then update knowledge. Claude Code: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`. Other tools: the `openspec-*` skills in `.agents/skills/`. Changes with no behavior change use `skip_specs: true`.

Work on a branch, never on the default branch. Each milestone or feature ends with a PR for review; pushing and opening it follow `permissions` in `specfold.yaml` (by default: ask the user first). Before an action set to `ask` under `permissions` in `specfold.yaml` (push, force-push, delete a remote branch, push tags, open, merge or close a PR), ask the user; never take one set to `deny`.

## 6. Knowledge rules

- One concept per file, kebab-case names, bundle-absolute links (`/decisions/x.md`).
- Frontmatter: `type`, `title`, one-line `description` (max 160 chars), `status`, and `generated: { by: claude-code/<model>, at: <ISO 8601 with offset> }` for agent writes.
- Agents write `status: draft` and never write `human:` actors; only humans verify.
- `index.md` files are generated: run `node scripts/specfold.mjs index` after adding, renaming or retitling a concept, and never edit them by hand. Add `log.md` entries with `node scripts/specfold.mjs log add [--kind <Kind>] <message>`, never by hand.
- Code comments stay short and point to knowledge with `see knowledge: /<path>.md` (`/conventions/code-comments.md`).
- Check knowledge with `node scripts/specfold.mjs validate`.

## 7. Commits (this repo only)

Format `<type>(<scope>): <gitmoji> <subject>`: English, lowercase (backticks for mixed-case identifiers), imperative, no trailing period, at most 72 characters, Unicode emoji. Subject only; the only lines after one blank line are the trailers `Task: <change>#<n>.<m>` and `Co-Authored-By:`. One logical change per commit; if the subject needs "and", split it. Breaking: `!` after type or scope plus 💥.

| type | default | also allowed |
| --- | --- | --- |
| feat | ✨ | 🎉 💄 🌐 💬 📈 🚩 🍱 ♿️ 🚸 📱 💫 🥚 🔍️ 🛂 👔 🩺 🦺 ✈️ 🧵 🗃️ 🏷️ 🥅 🔊 🧑‍💻 💸 👽️ |
| fix | 🐛 | 🚑️ 🔒️ 🩹 ✏️ 🚨 🥅 👽️ 🔇 🗃️ ♿️ 🚸 🦺 |
| docs | 📝 | 💡 📄 👥 |
| style | 🎨 | 🚨 |
| refactor | ♻️ | 🔥 🚚 🏗️ ⚰️ 🗑️ 🏷️ 🎨 🦺 🧵 |
| perf | ⚡️ | 🧵 |
| test | ✅ | 🧪 🤡 📸 🌱 |
| build | 📦️ | ➕ ➖ ⬆️ ⬇️ 📌 🔨 🧱 |
| ci | 👷 | 💚 🚀 |
| chore | 🔧 | 🔖 🔀 🙈 🔨 🔐 🎉 👥 📄 🧐 ⚗️ 🔇 🔊 🧱 |
| revert | ⏪️ | |

Scopes and the full mapping: `scripts/commit-convention.json`. Never 🚧 💩 🍻. Releases `chore(release): 🔖 vX.Y.Z`, merges `chore(merge): 🔀 <branch>`, dependencies `build(deps)`.

**Authorship:** the human user's git identity is always the author and committer; agents never change it. An agent that wrote or substantially changed a commit adds itself as `Co-Authored-By:`, using the trailer its tool writes by default (a model name in it is fine). Check a message with `node scripts/check-commit.mjs --message-file <file>`.
