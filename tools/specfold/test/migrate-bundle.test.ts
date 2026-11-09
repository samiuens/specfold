import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { addBundleSettings, installKit } from "../src/migrate/install.ts";
import { run } from "./helpers.ts";
import { fixtureRepo, TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const settings = (root: string) =>
  parse(readFileSync(join(root, "specfold.yaml"), "utf8")) as {
    types: string[];
    folders: Record<string, unknown>;
  };
const template = parse(readFileSync(join(TEMPLATE, "specfold.yaml"), "utf8")) as {
  types: string[];
  folders: Record<string, unknown>;
};

describe("migrate install: existing bundle", () => {
  // spec: specfold-migrate#bundle-types-and-folders
  it("adds the bundle's types and folders after the template's", async () => {
    const root = fixtureRepo("okf-bundle");
    installKit({ root, from: TEMPLATE, tools: ["agents", "claude"], profile: "knowledge" });
    const s = settings(root);
    expect(s.types).toEqual([...template.types, "App", "ADR", "Architecture", "Domain Concept", "Playbook"]);
    expect(Object.keys(s.folders)).toEqual([...Object.keys(template.folders), "apps", "playbooks"]);
    expect(s.folders.apps).toEqual({});
    expect(readFileSync(join(root, "specfold.yaml"), "utf8")).toContain("# Where your code lives");
    const result = await run(["validate", "--json"], root);
    const rules = (JSON.parse(result.stdout).findings as { rule: string }[]).map((f) => f.rule);
    expect(rules).not.toContain("P1");
  });

  // spec: specfold-migrate#no-bundle
  it("keeps the template's types and folders without a bundle", () => {
    const root = fixtureRepo("adr-docs");
    installKit({ root, from: TEMPLATE, tools: ["agents", "claude"] });
    const s = settings(root);
    expect(s.types).toEqual(template.types);
    expect(Object.keys(s.folders)).toEqual(Object.keys(template.folders));
  });

  it("quotes a type that YAML would misread", () => {
    const text = addBundleSettings("types:\n  - Term\n\nfolders:\n  domain: {}\n", {
      types: ["Note: draft"],
      folders: [],
    });
    expect((parse(text) as { types: string[] }).types).toEqual(["Term", "Note: draft"]);
  });
});
