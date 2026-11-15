import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { OMP_CONFIG, ompConfigText, parseOmpConfig, readOmpConfig } from "../src/omp/config.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

describe("omp: config", () => {
  it("reads a missing file as an empty mapping", () => {
    const doc = readOmpConfig(tempDir());
    expect(doc.toJS()).toEqual({});
    doc.setIn(["task", "maxRecursionDepth"], 1);
    expect(ompConfigText(doc)).toBe("task:\n  maxRecursionDepth: 1\n");
  });

  it("keeps comments when it writes the file back", () => {
    const root = tempDir();
    write(root, OMP_CONFIG, "# team settings\nbash:\n  patterns: [] # rules below\n");
    const doc = readOmpConfig(root);
    doc.setIn(["task", "maxRecursionDepth"], 1);
    expect(ompConfigText(doc)).toBe(
      "# team settings\nbash:\n  patterns: [] # rules below\ntask:\n  maxRecursionDepth: 1\n",
    );
  });

  it("keeps a 120-character line unfolded", () => {
    const line = `note: ${"word ".repeat(22)}done`;
    expect(line).toHaveLength(120);
    const doc = parseOmpConfig(`${line}\n`);
    doc.setIn(["task", "isolation", "enabled"], true);
    expect(ompConfigText(doc)).toBe(`${line}\ntask:\n  isolation:\n    enabled: true\n`);
  });

  it("refuses a top-level list with an environment error naming the file", () => {
    const root = tempDir();
    write(root, OMP_CONFIG, "- a\n- b\n");
    expect(() => readOmpConfig(root)).toThrow(EnvError);
    expect(() => readOmpConfig(root)).toThrow(`${OMP_CONFIG} is not a YAML mapping`);
    expect(() => parseOmpConfig("x: [a\n")).toThrow(/^\.omp\/config\.yml: /);
  });
});
