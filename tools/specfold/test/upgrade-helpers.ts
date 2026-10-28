import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyBlock, blockStyle } from "../src/migrate/blocks.ts";
import { BLOCK_FILES, kitOwned, MANIFEST_PATH, manifestText, sha256 } from "../src/migrate/install.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

/** Files of a minimal release; `changes` overrides or adds files (null removes one). */
export function release(version: string, changes: Record<string, string | null> = {}): string {
  const dir = tempDir();
  const files: Record<string, string | null> = {
    "specfold.yaml": `kit_version: ${version}          # set by \`specfold upgrade\`\nchannel: stable\n`,
    "scripts/specfold.mjs": `#!/usr/bin/env node\n// specfold ${version}\n`,
    "openspec/schemas/specfold/schema.yaml": "name: specfold\n",
    ".agents/skills/sf-lookup/SKILL.md": "# sf-lookup\n\nLook things up.\n",
    ".claude/agents/verifier.md": "# Verifier\n\nRun the tests.\n\nRun the gate.\n\nReport findings.\n",
    ".github/workflows/specfold-gate.yml": "name: specfold-gate\n",
    ".github/workflows/specfold-gate-comment.yml": "name: specfold-gate-comment\n",
    "AGENTS.md": "# Agent instructions\n\nRead knowledge first.\n",
    "CLAUDE.md": "@AGENTS.md\n",
    ".gitignore": ".specfold/local.yaml\n",
    "knowledge/index.md": "# Knowledge\n",
    ...changes,
  };
  for (const [path, text] of Object.entries(files)) if (text !== null) write(dir, path, text);
  chmodSync(join(dir, "scripts/specfold.mjs"), 0o755);
  return dir;
}

/** A git repository installed from `from` the way install does it: kit files, blocks and a manifest. */
export function installed(from: string, version: string): string {
  const root = tempDir();
  const files: Record<string, string> = {};
  const blocks: Record<string, string> = {};
  for (const p of kitOwned(from, ["agents", "claude"])) {
    cpSync(join(from, p), join(root, p));
    files[p] = sha256(readFileSync(join(from, p)));
  }
  for (const p of BLOCK_FILES) {
    if (!existsSync(join(from, p))) continue;
    const content = readFileSync(join(from, p), "utf8");
    const merged = applyBlock(undefined, content, blockStyle(p));
    if ("text" in merged) write(root, p, merged.text);
    blocks[p] = sha256(content);
  }
  write(root, "specfold.yaml", readFileSync(join(from, "specfold.yaml"), "utf8"));
  write(root, "knowledge/decisions/keep-it.md", "---\ntype: Decision\n---\n# Keep it\n");
  write(root, MANIFEST_PATH, manifestText(version, `v${version}`, { files, blocks }));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-qm", "install"], {
    cwd: root,
  });
  return root;
}

/** A release tarball of `dir` with its `.sha256`, placed in `out` the way `release.mjs pack` names it. */
export function packInto(out: string, dir: string, version: string): void {
  const stage = tempDir();
  cpSync(dir, join(stage, `specfold-template-v${version}`), { recursive: true, verbatimSymlinks: true });
  const tarball = join(out, `specfold-template-v${version}.tar.gz`);
  execFileSync("tar", ["-czf", tarball, "-C", stage, `specfold-template-v${version}`]);
  const hash = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  writeFileSync(`${tarball}.sha256`, `${hash}  specfold-template-v${version}.tar.gz\n`);
}
