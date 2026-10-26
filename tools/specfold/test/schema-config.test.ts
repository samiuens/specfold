import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tempDir } from "./helpers.ts";

const KIT = fileURLToPath(new URL("../../../", import.meta.url));
const OPENSPEC = join(KIT, "node_modules", ".bin", "openspec");

/** The template's openspec/ with one new change `demo`, and `openspec instructions <artifact>` for it. */
function instructions(artifact: string) {
  const dir = tempDir();
  cpSync(join(KIT, "template", "openspec"), join(dir, "openspec"), { recursive: true });
  spawnSync(OPENSPEC, ["new", "change", "demo"], { cwd: dir, encoding: "utf8" });
  return spawnSync(OPENSPEC, ["instructions", artifact, "--change", "demo"], { cwd: dir, encoding: "utf8" });
}

describe("shipped OpenSpec config", { timeout: 30_000 }, () => {
  // spec: specfold-schema#config-loads-cleanly
  it("loads the shipped config without warnings", () => {
    const result = instructions("proposal");
    expect(result.status).toBe(0);
    expect(result.stderr + result.stdout).not.toMatch(/unknown/i);
    expect(result.stdout).toContain('schema="specfold"');
    expect(result.stdout).toMatch(/<project_context>[\s\S]*Start at knowledge\/index\.md[\s\S]*Stack: </);
    expect(result.stdout).toContain("Link the knowledge concepts and decisions");
  });

  // spec: specfold-schema#design-rule-shown
  it("shows the design rule about commitments", () => {
    const result = instructions("design");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("record each in `## Commitments` as kept or blocked");
  });
});
