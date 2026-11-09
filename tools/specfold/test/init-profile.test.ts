import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { git, write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";
import { TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const read = (root: string, p: string) => readFileSync(join(root, p), "utf8");
const status = (root: string) => git(root, "status", "--porcelain", "--untracked-files=all");

/** A git repository on `main` made from the template, plus `files`, all committed. */
function templateRepo(files: Record<string, string> = {}, remove: string[] = []): string {
  const root = tempDir();
  cpSync(TEMPLATE, root, { recursive: true, verbatimSymlinks: true });
  for (const p of remove) rmSync(join(root, p), { recursive: true, force: true });
  for (const [path, content] of Object.entries(files)) write(root, path, content);
  git(root, "init", "-q", "-b", "main");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "from the template");
  return root;
}

/** The template's specfold.yaml with `profile` set. */
const settingsWith = (profile: string) =>
  read(TEMPLATE, "specfold.yaml").replace(/^profile: full$/m, `profile: ${profile}`);

const TS_PROJECT = { "package.json": "{}\n", "tsconfig.json": "{}\n", "src/index.ts": "export {};\n" };

describe("specfold init: profile", () => {
  // spec: specfold-init#knowledge-repository-without-openspec
  it("needs no openspec/config.yaml for the knowledge profile", async () => {
    const root = templateRepo({ "specfold.yaml": settingsWith("knowledge") }, ["openspec"]);
    const result = await run(["init", "--json"], root);
    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
  });

  it("still needs openspec/config.yaml for the full profile", async () => {
    const root = templateRepo({}, ["openspec"]);
    const result = await run(["init"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("openspec/config.yaml");
  });

  it("refuses an unknown --profile", async () => {
    const root = templateRepo();
    const result = await run(["init", "--profile", "lite"], root);
    expect(result.code).toBe(2);
    expect(status(root)).toBe("");
  });
});
