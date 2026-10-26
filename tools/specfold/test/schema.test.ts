import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tempDir } from "./helpers.ts";

const KIT = fileURLToPath(new URL("../../../", import.meta.url));
const OPENSPEC = join(KIT, "node_modules", ".bin", "openspec");

/** A temporary repository holding the template's schema and one empty change `demo`. */
function repoWithSchema(): string {
  const dir = tempDir();
  cpSync(join(KIT, "template", "openspec", "schemas"), join(dir, "openspec", "schemas"), { recursive: true });
  mkdirSync(join(dir, "openspec", "changes", "demo"), { recursive: true });
  writeFileSync(
    join(dir, "openspec", "changes", "demo", ".openspec.yaml"),
    "schema: specfold\ncreated: 2026-10-26\n",
  );
  return dir;
}

const change = (dir: string, file: string, content = "# x\n") => {
  const path = join(dir, "openspec", "changes", "demo", file);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
};

const openspec = (dir: string, args: string[]) =>
  execFileSync(OPENSPEC, args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const json = (dir: string, args: string[]) => JSON.parse(openspec(dir, [...args, "--json"]));

interface ArtifactStatus {
  id: string;
  status: string;
  missingDeps?: string[];
}
const statusOf = (dir: string, id: string): ArtifactStatus =>
  json(dir, ["status", "--change", "demo"]).artifacts.find((a: ArtifactStatus) => a.id === id);

describe("specfold schema", { timeout: 30_000 }, () => {
  // spec: specfold-schema#schema-validates
  it("validates with OpenSpec", () => {
    expect(openspec(repoWithSchema(), ["schema", "validate", "specfold"])).toContain("valid");
  });

  // spec: specfold-schema#brief-comes-first
  it("makes brief the only ready artifact of an empty change", () => {
    const dir = repoWithSchema();
    const artifacts: ArtifactStatus[] = json(dir, ["status", "--change", "demo"]).artifacts;
    expect(artifacts.map((a) => a.id)).toEqual([
      "brief",
      "proposal",
      "specs",
      "design",
      "knowledge",
      "tasks",
    ]);
    expect(artifacts.filter((a) => a.status === "ready").map((a) => a.id)).toEqual(["brief"]);
    expect(statusOf(dir, "proposal")).toMatchObject({ status: "blocked", missingDeps: ["brief"] });
  });

  // spec: specfold-schema#tasks-wait-for-knowledge
  it("blocks tasks until knowledge.md exists", () => {
    const dir = repoWithSchema();
    for (const file of ["brief.md", "proposal.md", "design.md", "specs/demo/spec.md"]) change(dir, file);
    expect(statusOf(dir, "tasks")).toMatchObject({ status: "blocked", missingDeps: ["knowledge"] });
  });

  // spec: specfold-schema#apply-reads-the-task-list
  it("tracks tasks.md for apply", () => {
    const dir = repoWithSchema();
    change(dir, "tasks.md", "# Tasks\n\n## 1. A\n\n- [ ] 1.1 x\n");
    const apply = json(dir, ["instructions", "apply", "--change", "demo"]);
    expect(apply.contextFiles.tasks[0]).toMatch(/tasks\.md$/);
    expect(apply.taskTrackingConfigured).toBe(true);
  });

  // spec: specfold-schema#brief-rendered-for-a-new-change
  it("renders the brief template and its confirmation rule", () => {
    const brief = json(repoWithSchema(), ["instructions", "brief", "--change", "demo"]);
    const sections = [...brief.template.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(sections).toEqual(["Wish", "Decisions", "Out of scope", "Open questions", "Confirmation"]);
    expect(brief.template).toContain("| # | Question | Answer | Source |");
    expect(brief.template).toMatch(/^confirmed_by:/m);
    expect(brief.template).toMatch(/^confirmed_at:/m);
    expect(brief.instruction).toContain(
      "Never fill Confirmation yourself without the user's explicit approval",
    );
  });

  // spec: specfold-schema#knowledge-rendered-for-a-change
  it("renders the knowledge template with a delta block", () => {
    const knowledge = json(repoWithSchema(), ["instructions", "knowledge", "--change", "demo"]);
    expect(knowledge.template).toMatch(
      /^## Delta\n\n```yaml\nops:\n[\s\S]*^empty_reason:[\s\S]*^```\n\n## Notes$/m,
    );
    expect(knowledge.instruction).toContain(
      "Every capability in this change's delta specs needs a Capability entry",
    );
  });

  // spec: specfold-schema#design-rendered-for-a-change
  it("ends the design template with the Commitments section", () => {
    const design = json(repoWithSchema(), ["instructions", "design", "--change", "demo"]);
    const sections = [...design.template.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(sections.at(-1)).toBe("Commitments");
    expect(design.template).toContain(": kept");
    expect(design.template).toContain(": blocked: ");
    expect(design.instruction).toContain("**Commitments** (always, last)");
  });

  // spec: specfold-schema#tasks-rendered-for-a-change
  it("renders the task-breakdown template", () => {
    const tasks = json(repoWithSchema(), ["instructions", "tasks", "--change", "demo"]);
    for (const key of ["files:", "depends:", "scenarios:", "agent:"]) expect(tasks.template).toContain(key);
    expect(tasks.template).toMatch(/^ {2}- Done when: /m);
    const groups = [...tasks.template.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(groups.at(-2)).toMatch(/^\d+\. Knowledge$/);
    expect(groups.at(-1)).toBe("Workflow follow-up");
    expect(tasks.template).toContain("specfold sync <change>");
  });
});
