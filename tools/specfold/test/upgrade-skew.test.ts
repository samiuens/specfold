import { describe, expect, it } from "vitest";
import { refuseSkew, writes } from "../src/upgrade/skew.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

declare const __SPECFOLD_VERSION__: string;

/** A Specfold root whose manifest says `version`, with an empty bundle. */
function repo(version: string) {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Decision]\n");
  write(root, "knowledge/index.md", "# Knowledge\n");
  write(
    root,
    ".specfold/manifest.json",
    JSON.stringify({ manifest_version: 1, kit_version: version, files: {}, blocks: {} }),
  );
  return root;
}

describe("version skew", () => {
  // spec: specfold-upgrade#old-cli-refuses-to-write
  it("refuses write commands when the manifest is newer than the CLI, and keeps reads working", async () => {
    const root = repo("999.0.0");
    const index = await run(["index"], root);
    expect(index.code).toBe(2);
    expect(index.stderr).toContain("run 'specfold upgrade'");
    expect((await run(["index", "--check"], root)).stderr).not.toContain("specfold upgrade");
    expect((await run(["lookup", "anything"], root)).code).not.toBe(2);
  });

  it("lets every command run when the manifest is not newer", async () => {
    expect((await run(["index"], repo(__SPECFOLD_VERSION__))).code).toBe(0);
    expect(() => refuseSkew(repo("dev"), "0.1.0")).not.toThrow();
    expect(() => refuseSkew(repo("0.2.0"), "dev")).not.toThrow();
    expect(() => refuseSkew(tempDir(), "0.1.0")).not.toThrow();
  });

  it("classifies subcommands and flags that only read", () => {
    expect(writes("agents", ["sync"], { check: true })).toBe(false);
    expect(writes("backlog", ["list"], {})).toBe(false);
    expect(writes("backlog", ["add"], {})).toBe(true);
    expect(writes("wt", ["plan"], {})).toBe(false);
    expect(writes("sync", ["c"], { "dry-run": true })).toBe(false);
    expect(writes("upgrade", [], { yes: true })).toBe(false);
    expect(writes("gate", [], {})).toBe(false);
  });
});
