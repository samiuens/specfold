import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { tempDir } from "./helpers.ts";

const KIT = fileURLToPath(new URL("../../../", import.meta.url));
const OPENSPEC = join(KIT, "node_modules", ".bin", "openspec");

// spec: specfold-schema#config-loads-cleanly
it("loads the shipped config without warnings", { timeout: 30_000 }, () => {
  const dir = tempDir();
  cpSync(join(KIT, "template", "openspec"), join(dir, "openspec"), { recursive: true });
  spawnSync(OPENSPEC, ["new", "change", "demo"], { cwd: dir, encoding: "utf8" });
  const result = spawnSync(OPENSPEC, ["instructions", "proposal", "--change", "demo"], {
    cwd: dir,
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  expect(result.stderr + result.stdout).not.toMatch(/unknown/i);
  expect(result.stdout).toContain('schema="specfold"');
  expect(result.stdout).toMatch(/<project_context>[\s\S]*Start at knowledge\/index\.md[\s\S]*Stack: </);
  expect(result.stdout).toContain("Link the knowledge concepts and decisions");
});
