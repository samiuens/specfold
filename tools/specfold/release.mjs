#!/usr/bin/env node
// Kit repo only: checks release versions, packs the template tarball and prints upgrade notes.
// Run from the kit root. see knowledge: /capabilities/specfold-release.md
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const USAGE = "usage: node tools/specfold/release.mjs check | pack <version> [--out <dir>] | notes <version>";

class Exit extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const read = (path) => readFileSync(path, "utf8");

/** The three version fields a release must agree on, by file. */
function versions(root) {
  const yaml = /^kit_version:\s*"?([^"\s#]+)"?/m.exec(read(join(root, "template/specfold.yaml")));
  return {
    "tools/specfold/package.json": JSON.parse(read(join(root, "tools/specfold/package.json"))).version,
    "template/specfold.yaml": yaml?.[1],
    "template/.specfold/manifest.json": JSON.parse(read(join(root, "template/.specfold/manifest.json")))
      .kit_version,
  };
}

/** Lines naming each field that differs from the package version; empty when all agree. */
function mismatches(root) {
  const found = versions(root);
  const expected = found["tools/specfold/package.json"];
  return Object.entries(found)
    .filter(([, value]) => value !== expected)
    .map(([file, value]) => `${file} says ${value ?? "nothing"}, the package says ${expected}`);
}

function check(root, out) {
  const problems = mismatches(root);
  for (const p of problems) out(`${p}\n`);
  out(problems.length === 0 ? `versions agree: ${versions(root)["tools/specfold/package.json"]}\n` : "");
  return problems.length === 0 ? 0 : 1;
}

function pack(root, version, outDir, out) {
  const problems = mismatches(root);
  if (problems.length > 0) throw new Exit(2, `versions disagree; nothing was packed\n${problems.join("\n")}`);
  const current = versions(root)["tools/specfold/package.json"];
  if (current !== version)
    throw new Exit(2, `the package version is ${current}, not ${version}; nothing was packed`);
  const name = `specfold-template-v${version}`;
  const stage = mkdtempSync(join(tmpdir(), "specfold-release-"));
  try {
    const top = join(stage, name);
    const tracked = execFileSync("git", ["ls-files", "-z", "template", "upgrade"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean);
    for (const file of tracked) {
      const target = join(top, file.startsWith("template/") ? file.slice("template/".length) : file);
      mkdirSync(dirname(target), { recursive: true });
      // git tracks symlinks (the skill links) as files: keep them links, never follow them
      const source = join(root, file);
      if (lstatSync(source).isSymbolicLink()) symlinkSync(readlinkSync(source), target);
      else copyFileSync(source, target);
    }
    mkdirSync(outDir, { recursive: true });
    const tarball = join(outDir, `${name}.tar.gz`);
    execFileSync("tar", ["-czf", tarball, "-C", stage, name]);
    const hash = createHash("sha256").update(readFileSync(tarball)).digest("hex");
    writeFileSync(`${tarball}.sha256`, `${hash}  ${name}.tar.gz\n`);
    out(`packed ${tarball} (${tracked.length} files)\nsha256 ${hash}\n`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
  return 0;
}

function notes(root, version, out) {
  const file = join(root, "upgrade/notes", `${version}.md`);
  out(`## Upgrade notes\n\n${existsSync(file) ? read(file).trimEnd() : "No manual steps."}\n`);
  return 0;
}

export function release(argv, root, out) {
  const [sub, ...rest] = argv;
  const outAt = rest.indexOf("--out");
  const outDir = outAt === -1 ? join(root, "dist") : resolve(root, rest[outAt + 1] ?? "");
  const args = outAt === -1 ? rest : rest.filter((_, i) => i !== outAt && i !== outAt + 1);
  if (sub === "check" && args.length === 0) return check(root, out);
  if (sub === "pack" && args.length === 1 && (outAt === -1 || rest[outAt + 1]))
    return pack(root, args[0], outDir, out);
  if (sub === "notes" && args.length === 1) return notes(root, args[0], out);
  throw new Exit(
    2,
    ["check", "pack", "notes"].includes(sub)
      ? USAGE
      : `${sub ? `unknown subcommand '${sub}'` : "missing subcommand"}: check, pack or notes\n${USAGE}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = release(process.argv.slice(2), process.cwd(), (t) => process.stdout.write(t));
  } catch (error) {
    if (!(error instanceof Exit)) throw error;
    process.stderr.write(`release: ${error.message}\n`);
    process.exitCode = error.code;
  }
}
