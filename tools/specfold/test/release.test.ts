import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const SCRIPT = new URL("../release.mjs", import.meta.url).pathname;

/** A kit-shaped git repository whose three version fields say `version`, or `template` for the yaml. */
function kit(version: string, template = version): string {
  const root = tempDir();
  write(root, "tools/specfold/package.json", `${JSON.stringify({ name: "specfold", version })}\n`);
  write(root, "template/specfold.yaml", `kit_version: ${template}  # x-release-please-version\n`);
  write(
    root,
    "template/.specfold/manifest.json",
    `${JSON.stringify({ manifest_version: 1, kit_version: version })}\n`,
  );
  write(root, "template/scripts/specfold.mjs", "#!/usr/bin/env node\n");
  write(root, "upgrade/README.md", "# Upgrade\n");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  return root;
}

const release = (root: string, ...args: string[]) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};

describe("release.mjs", () => {
  // spec: specfold-release#unknown-subcommand
  it("exits with 2 on an unknown subcommand and names the three", () => {
    const result = release(kit("0.1.0-rc.1"), "publish");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown subcommand 'publish': check, pack or notes");
  });

  // spec: specfold-release#template-behind-the-package
  it("reports each version field that differs from the package", () => {
    const result = release(kit("0.1.0-rc.1", "0.0.0"), "check");
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("template/specfold.yaml says 0.0.0, the package says 0.1.0-rc.1\n");
    expect(release(kit("0.1.0-rc.1"), "check")).toMatchObject({
      code: 0,
      stdout: "versions agree: 0.1.0-rc.1\n",
    });
  });

  // spec: specfold-release#pack-a-release
  it("packs the template and upgrade/ below one top folder, with a matching sha256 file", () => {
    const root = kit("0.1.0-rc.1");
    const result = release(root, "pack", "0.1.0-rc.1", "--out", "dist");
    expect(result.code).toBe(0);
    const tarball = join(root, "dist/specfold-template-v0.1.0-rc.1.tar.gz");
    const listing = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" }).split("\n");
    expect(listing).toContain("specfold-template-v0.1.0-rc.1/scripts/specfold.mjs");
    expect(listing).toContain("specfold-template-v0.1.0-rc.1/upgrade/README.md");
    expect(listing).toContain("specfold-template-v0.1.0-rc.1/specfold.yaml");
    const hash = createHash("sha256").update(readFileSync(tarball)).digest("hex");
    expect(readFileSync(`${tarball}.sha256`, "utf8")).toBe(`${hash}  specfold-template-v0.1.0-rc.1.tar.gz\n`);
  });

  // spec: specfold-release#version-mismatch
  it("refuses to pack another version and writes nothing", () => {
    const root = kit("0.1.0-rc.1");
    const result = release(root, "pack", "0.2.0", "--out", "dist");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("the package version is 0.1.0-rc.1, not 0.2.0");
    expect(existsSync(join(root, "dist"))).toBe(false);
    expect(release(kit("0.1.0-rc.1", "0.0.0"), "pack", "0.1.0-rc.1").code).toBe(2);
    expect(readdirSync(root)).not.toContain("dist");
  });
});
