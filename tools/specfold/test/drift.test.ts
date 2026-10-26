import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { conceptDependencies } from "../src/drift/deps.ts";
import { driftOf } from "../src/drift/drift.ts";
import { commitAt, dependent } from "./drift-helpers.ts";
import { git, write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

function repo(): string {
  const root = tempDir();
  git(root, "init", "-q", "-b", "main");
  write(root, "specfold.yaml", "types: [Decision]\nsource_globs: ['src/**']\n");
  return root;
}

/** The dependencies of `decisions/retries.md`. */
function retries(root: string) {
  const concept = conceptDependencies(root, join(root, "knowledge"), ["src/**"]).find(
    (c) => c.rel === "decisions/retries.md",
  );
  if (!concept) throw new Error("decisions/retries.md not found");
  return concept;
}

describe("conceptDependencies", () => {
  // spec: specfold-drift#code-reference
  it("collects code references, resources and folders", () => {
    const root = repo();
    write(root, "src/retry.ts", "// see knowledge: /decisions/retries.md\n");
    write(root, "docs/ops/a.md", "x\n");
    write(
      root,
      "knowledge/decisions/retries.md",
      dependent(
        "generated: { by: x/y, at: 2026-10-01T00:00:00Z }\nresource: ../../docs/ops\nsources:\n  - id: a\n    resource: ../../docs/ops/a.md#part\n  - id: b\n    resource: ../../docs/missing.md",
      ),
    );
    expect(retries(root).paths).toEqual(["docs/ops", "docs/ops/a.md", "src/retry.ts"]);
  });

  // spec: specfold-drift#url-source
  it("ignores URL sources, so such a concept never drifts", () => {
    const root = repo();
    commitAt(root, "2026-10-01T00:00:00Z", {
      "knowledge/decisions/retries.md": dependent(
        "generated: { by: x/y, at: 2026-10-01T00:00:00Z }\nsources:\n  - id: a\n    resource: https://example.com/docs",
      ),
    });
    commitAt(root, "2026-10-10T00:00:00Z", { "src/app.ts": "x\n" });
    expect(retries(root).paths).toEqual([]);
    expect(driftOf(root, retries(root))).toBeUndefined();
  });
});

describe("driftOf", () => {
  // spec: specfold-drift#code-changed-after-verification
  it("reports commits to dependent files after the baseline", () => {
    const root = repo();
    commitAt(root, "2026-10-01T10:00:00Z", {
      "src/retry.ts": "// see knowledge: /decisions/retries.md\n",
      "knowledge/decisions/retries.md": dependent(
        "generated: { by: x/y, at: 2026-09-01T00:00:00Z }\nverified: { by: human:ana, at: 2026-10-01T10:00:00Z }",
      ),
    });
    commitAt(root, "2026-10-05T00:00:00Z", { "src/other.ts": "x\n" }, "unrelated");
    commitAt(
      root,
      "2026-10-10T00:00:00Z",
      { "src/retry.ts": "// see knowledge: /decisions/retries.md\nx\n" },
      "retry faster",
    );
    const drift = driftOf(root, retries(root));
    expect(drift).toMatchObject({
      path: "knowledge/decisions/retries.md",
      baseline: "2026-10-01T10:00:00Z",
      commits: [{ subject: "retry faster", paths: ["src/retry.ts"] }],
    });
    expect(drift?.commits[0]?.date).toMatch(/^2026-10-10T00:00:00/);
  });

  // spec: specfold-drift#concept-edited-after-the-code
  it("uses the concept's last commit when it is later than its trust time", () => {
    const root = repo();
    const text = dependent("generated: { by: x/y, at: 2026-10-01T00:00:00Z }");
    commitAt(root, "2026-10-01T00:00:00Z", {
      "src/retry.ts": "// see knowledge: /decisions/retries.md\n",
      "knowledge/decisions/retries.md": text,
    });
    commitAt(root, "2026-10-10T00:00:00Z", {
      "src/retry.ts": "// see knowledge: /decisions/retries.md\nx\n",
    });
    expect(driftOf(root, retries(root))).toBeDefined();
    commitAt(root, "2026-10-12T00:00:00Z", { "knowledge/decisions/retries.md": `${text}More.\n` });
    expect(driftOf(root, retries(root))).toBeUndefined();
  });
});
