import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { globToRegExp, matchesAny, walkFiles } from "../src/glob.ts";
import { tempDir } from "./helpers.ts";

const m = (glob: string, path: string) => globToRegExp(glob).test(path);

describe("glob", () => {
  it("lets **/ match zero or more folders", () => {
    expect(m("knowledge/**/*.md", "knowledge/index.md")).toBe(true);
    expect(m("knowledge/**/*.md", "knowledge/a/b/c.md")).toBe(true);
    expect(m("**/*.ts", "a.ts")).toBe(true);
  });

  it("lets a trailing ** match everything below", () => {
    expect(m("src/**", "src/a/b.ts")).toBe(true);
    expect(m("src/**", "src")).toBe(false);
    expect(m("src/**", "srcx/a.ts")).toBe(false);
  });

  it("keeps * and ? within one segment", () => {
    expect(m("src/*.ts", "src/a.ts")).toBe(true);
    expect(m("src/*.ts", "src/a/b.ts")).toBe(false);
    expect(m("src/?.ts", "src/a.ts")).toBe(true);
    expect(m("src/?.ts", "src/ab.ts")).toBe(false);
  });

  it("expands braces and escapes regex characters", () => {
    expect(m("src/*.{ts,mjs}", "src/a.mjs")).toBe(true);
    expect(m("src/*.{ts,mjs}", "src/a.js")).toBe(false);
    expect(m("a+b/(x).md", "a+b/(x).md")).toBe(true);
    expect(matchesAny("lib/x.ts", ["src/**", "lib/**"])).toBe(true);
  });

  it("walks files sorted, skipping node_modules and dot folders", () => {
    const root = tempDir();
    for (const dir of ["src/b", "node_modules/x", ".git", "src/.cache"])
      mkdirSync(join(root, dir), { recursive: true });
    for (const file of [
      "src/b/z.ts",
      "src/a.ts",
      "node_modules/x/i.js",
      ".git/HEAD",
      "src/.cache/c",
      ".env",
      "README.md",
    ]) {
      writeFileSync(join(root, file), "x");
    }
    expect(walkFiles(root)).toEqual(["README.md", "src/a.ts", "src/b/z.ts"]);
  });
});
