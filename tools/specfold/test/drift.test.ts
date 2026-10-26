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
