import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { syncIndexes } from "../src/indexes/command.ts";
import { generateIndexes } from "../src/indexes/generate.ts";
import { locationsByConcept, scanReferences } from "../src/indexes/refs.ts";
import { requireConfig } from "../src/repo.ts";
import { tempDir } from "./helpers.ts";

export const git = (root: string, ...args: string[]) =>
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
    cwd: root,
    encoding: "utf8",
  });

export const write = (root: string, rel: string, content: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

/** Regenerates every index.md, as `specfold index` does. */
export function writeIndexes(root: string): void {
  const config = requireConfig(root);
  const refs = scanReferences(root, config.sourceGlobs);
  const bundle = join(root, "knowledge");
  syncIndexes(root, bundle, generateIndexes(bundle, config, locationsByConcept(refs)).indexes, false);
}

export function commit(root: string, files: Record<string, string>, message = "work"): void {
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, "add", "-A");
  git(root, "commit", "-q", "--allow-empty", "-m", message);
}

export const FRESH = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, "Z");

export const concept = (type: string, body: string, extra = "") =>
  `---\ntype: ${type}\ntitle: ${type}\ndescription: A ${type.toLowerCase()}.\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }${extra}\n---\n\n${body}\n`;

/**
 * A repository on branch `work`, branched from `main`, with a clean bundle of two linked
 * concepts and generated indexes. `src/**` are source files.
 */
export function gateRepo(files: Record<string, string> = {}): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  for (const [rel, content] of Object.entries({
    ".gitignore": "node_modules/\n",
    "specfold.yaml": "types: [Term, Decision, Reference, Capability]\nsource_globs: ['src/**']\n",
    "src/app.ts": "export const app = 1;\n",
    "knowledge/domain/a.md": concept("Term", "See [b](/domain/b.md)."),
    "knowledge/domain/b.md": concept("Term", "See [a](/domain/a.md)."),
    ...files,
  }))
    write(root, rel, content);
  writeIndexes(root);
  commit(root, {}, "base");
  git(root, "checkout", "-q", "-b", "work");
  return root;
}

const FIXTURE = new URL("./fixtures/change/", import.meta.url);
const fixture = (rel: string) => readFileSync(new URL(rel, FIXTURE), "utf8");

/** The valid `demo` change of the change check fixture, with the concept its brief cites and a test for its scenario. */
export const demoChange = (): Record<string, string> => ({
  "knowledge/decisions/receipts.md": concept("Term", "Receipts go by mail."),
  // the marker is built from parts, so the kit's own trace never reads it as a reference
  "test/checkout.test.ts": `// ${"spec"}: guest-checkout#guest-pays-without-account\n`,
  ...Object.fromEntries(
    ["brief.md", "knowledge.md", "tasks.md", ".openspec.yaml", "specs/guest-checkout/spec.md"].map((f) => [
      `openspec/changes/demo/${f}`,
      fixture(`openspec/changes/demo/${f}`),
    ]),
  ),
});
