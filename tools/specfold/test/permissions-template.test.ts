import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { planPermissions } from "../src/permissions/render.ts";
import { TEMPLATE } from "./migrate-helpers.ts";

const read = (p: string) => readFileSync(join(TEMPLATE, p), "utf8");

describe("permissions: template", () => {
  it("ships .claude/settings.json in step with the permissions in specfold.yaml", () => {
    const config = parse(read("specfold.yaml")) as { permissions?: unknown; agents?: { targets?: string[] } };
    expect(config.permissions).toBeDefined();
    const plan = planPermissions(
      config.permissions,
      config.agents?.targets ?? [],
      read(".claude/settings.json"),
    );
    expect(plan.problems).toEqual([]);
    expect(plan.changes).toEqual([]);
  });

  it("sets every action to ask", () => {
    const config = parse(read("specfold.yaml")) as { permissions: Record<string, string> };
    expect(new Set(Object.values(config.permissions))).toEqual(new Set(["ask"]));
    expect(Object.keys(config.permissions)).toHaveLength(7);
  });
});
