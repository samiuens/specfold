import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const SCRIPT = new URL("../docs.mjs", import.meta.url).pathname;

/** A kit-shaped folder whose CLI knows two commands and prints `--help` like the real one. */
function kit(): string {
  const root = tempDir();
  write(
    root,
    "scripts/specfold.mjs",
    `const [name, flag] = process.argv.slice(2);
const usages = { audit: "specfold audit [--json]", wt: "specfold wt plan | new <change>" };
if (name === "--help") {
  console.log("Usage: specfold <command> [options]\\n\\nCommands:\\n  audit       report stale concepts\\n  wt          plan worktrees\\n\\nOptions:\\n  --help      show help");
} else if (flag === "--help") console.log("Usage: " + usages[name]);
`,
  );
  return root;
}

const docs = (root: string, ...args: string[]) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};

describe("docs.mjs", () => {
  it("writes one section per command with its summary and usage line", () => {
    const root = kit();
    expect(docs(root).code).toBe(0);
    const text = readFileSync(join(root, "docs/commands.md"), "utf8");
    expect(text).toContain("## audit\n\nReport stale concepts.\n\n```sh\nspecfold audit [--json]\n```\n");
    expect(text).toContain("## wt\n\nPlan worktrees.\n\n```sh\nspecfold wt plan | new <change>\n```\n");
    expect(text).not.toContain("--help      show help");
  });

  it("exits with 1 on a stale reference and names the fix, 0 when it is current", () => {
    const root = kit();
    write(root, "docs/commands.md", "# Command reference\n");
    const stale = docs(root, "--check");
    expect(stale.code).toBe(1);
    expect(stale.stderr).toBe(
      "docs: docs/commands.md is stale; run node tools/specfold/docs.mjs and commit it\n",
    );
    docs(root);
    expect(docs(root, "--check").code).toBe(0);
  });

  it("exits with 2 on an unknown argument", () => {
    const result = docs(kit(), "--write");
    expect(result.code).toBe(2);
    expect(result.stderr).toBe("docs: usage: node tools/specfold/docs.mjs [--check]\n");
  });
});
