import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { marker, renderRole } from "../src/agents/omp.ts";
import { parseText } from "../src/bundle.ts";
import { run, tempDir } from "./helpers.ts";

const IMPLEMENTER = `---
name: implementer
description: Implements one task group. Never pushes and never spawns agents.
model: sonnet
effort: medium
maxTurns: 80
isolation: worktree
skills:
  - sf-lookup
disallowedTools: Agent
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: node scripts/specfold.mjs hook claude-no-push
---

You are an implementer.
`;

const VERIFIER = `---
name: verifier
description: Checks a change.
model: opus
effort: high
tools: Read, Grep, Glob, Bash
---

You are the verifier.
`;

const SCOUT = `---
name: scout
description: Answers one question.
model: haiku
tools: Read, Grep, Glob, Bash
---

You are the scout.
`;

const frontmatter = (text: string) => parseText("role.md", text).frontmatter?.data as Record<string, unknown>;

function repo(tools: string, agents: Record<string, string> = {}): string {
  const root = tempDir();
  writeFileSync(join(root, "specfold.yaml"), `types: [Decision]\ntools: ${tools}\n`);
  mkdirSync(join(root, ".claude/agents"), { recursive: true });
  for (const [name, text] of Object.entries(agents))
    writeFileSync(join(root, `.claude/agents/${name}.md`), text);
  return root;
}

const OMP = "[agents, claude, omp]";

async function syncJson(root: string, extra: string[] = []) {
  const result = await run(["agents", "sync", "--json", ...extra], root);
  return { code: result.code, out: result.stdout ? JSON.parse(result.stdout) : undefined };
}

describe("agents sync: omp role rendering", () => {
  // spec: specfold-agents-sync#implementer-mapped
  it("maps model, effort, skills and the spawn ban, drops isolation and hooks (implementer mapped)", () => {
    const text = renderRole("implementer", IMPLEMENTER);
    const data = frontmatter(text);
    expect(Object.keys(data)).toEqual([
      "name",
      "description",
      "model",
      "thinking-level",
      "spawns",
      "autoload-skills",
    ]);
    expect(data).toEqual({
      name: "implementer",
      description: "Implements one task group. Never pushes and never spawns agents.",
      model: "@default",
      "thinking-level": "medium",
      spawns: "",
      "autoload-skills": ["sf-lookup"],
    });
    expect(text).toContain('\nmodel: "@default"\n');
    expect(text).toContain('\nspawns: ""\n');
    expect(text).not.toMatch(/isolation|hooks|maxTurns|claude-no-push/);
    expect(parseText("role.md", text).body).toBe(`${marker("implementer")}\n\nYou are an implementer.\n`);
  });

  // spec: specfold-agents-sync#read-only-tools-mapped
  it("maps a comma-separated tool list to omp's tool names (read-only tools mapped)", () => {
    const data = frontmatter(renderRole("verifier", VERIFIER));
    expect(data.tools).toEqual(["read", "grep", "glob", "bash"]);
    expect(data.model).toBe("@slow");
    expect(data["thinking-level"]).toBe("high");
    expect(data).not.toHaveProperty("spawns");
  });

  it("drops unknown models and unmapped tools", () => {
    const source = "---\nname: x\ndescription: d\nmodel: inherit\ntools: [Read, ExitPlanMode, Agent]\n---\n";
    const data = frontmatter(renderRole("x", source));
    expect(data).toEqual({ name: "x", description: "d", tools: ["read", "task"] });
  });

  it("reads a Claude Code frontmatter that is not strict YAML line by line", () => {
    const source = `---
name: verifier
description: Checks a change after it is merged: tests and the gate.
model: opus
skills:
  - sf-lookup
tools: Read, Bash
---

Body.
`;
    const text = renderRole("verifier", source);
    expect(frontmatter(text)).toEqual({
      name: "verifier",
      description: "Checks a change after it is merged: tests and the gate.",
      model: "@slow",
      tools: ["read", "bash"],
      "autoload-skills": ["sf-lookup"],
    });
    expect(parseText("role.md", text).body).toBe(`${marker("verifier")}\n\nBody.\n`);
  });
});

describe("agents sync: omp roles", () => {
  // spec: specfold-agents-sync#roles-written
  it("writes a role per Claude agent and skips the planner (roles written)", async () => {
    const root = repo(OMP, { scout: SCOUT, planner: "---\nname: planner\ndescription: p\n---\n\nPlan.\n" });
    const { code, out } = await syncJson(root);
    expect(code).toBe(0);
    expect(out.actions).toContainEqual({
      path: ".omp/agents/scout.md",
      action: "write",
      target: ".claude/agents/scout.md",
    });
    const written = readFileSync(join(root, ".omp/agents/scout.md"), "utf8");
    expect(written).toBe(renderRole("scout", SCOUT));
    expect(parseText("role.md", written).body).toBe(`${marker("scout")}\n${parseText("s.md", SCOUT).body}`);
    expect(existsSync(join(root, ".omp/agents/planner.md"))).toBe(false);
    expect((await syncJson(root, ["--check"])).code).toBe(0);
  });

  // spec: specfold-agents-sync#not-listed
  it("creates no .omp folder when tools does not list omp (not listed)", async () => {
    const root = repo("[agents, claude]", { scout: SCOUT });
    const { code, out } = await syncJson(root);
    expect(code).toBe(0);
    expect(out.actions).toEqual([]);
    expect(existsSync(join(root, ".omp"))).toBe(false);
  });

  it("removes own roles but keeps hand-written ones when omp is no longer listed", async () => {
    const root = repo(OMP, { scout: SCOUT, verifier: VERIFIER });
    await syncJson(root);
    writeFileSync(join(root, ".omp/agents/verifier.md"), "---\nname: verifier\n---\nmine\n");
    writeFileSync(join(root, "specfold.yaml"), "types: [Decision]\ntools: [agents, claude]\n");
    const { out } = await syncJson(root);
    expect(out.actions).toEqual([{ path: ".omp/agents/scout.md", action: "remove", target: null }]);
    expect(existsSync(join(root, ".omp/agents/scout.md"))).toBe(false);
    expect(readFileSync(join(root, ".omp/agents/verifier.md"), "utf8")).toContain("mine");
  });

  // spec: specfold-agents-sync#source-removed
  it("removes an own role whose source is gone and reports it (source removed)", async () => {
    const root = repo(OMP, { old: SCOUT.replace("name: scout", "name: old") });
    await syncJson(root);
    expect(existsSync(join(root, ".omp/agents/old.md"))).toBe(true);
    expect(readFileSync(join(root, ".omp/agents/old.md"), "utf8")).toContain(marker("old"));
    writeFileSync(join(root, ".claude/agents/scout.md"), SCOUT);
    rmSync(join(root, ".claude/agents/old.md"));
    const result = await run(["agents", "sync"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(".omp/agents/old.md: remove\n");
    expect(existsSync(join(root, ".omp/agents/old.md"))).toBe(false);
    expect(existsSync(join(root, ".omp/agents/scout.md"))).toBe(true);
  });

  // spec: specfold-agents-sync#hand-written-role-kept
  it("leaves a hand-written role unchanged and reports it as kept (hand-written role kept)", async () => {
    const root = repo(OMP, { scout: SCOUT });
    mkdirSync(join(root, ".omp/agents"), { recursive: true });
    const own = "---\nname: scout\ndescription: mine\n---\n\nMy scout.\n";
    writeFileSync(join(root, ".omp/agents/scout.md"), own);
    const { code, out } = await syncJson(root, ["--check"]);
    expect(out.actions).toContainEqual({ path: ".omp/agents/scout.md", action: "kept", target: null });
    await syncJson(root);
    expect(readFileSync(join(root, ".omp/agents/scout.md"), "utf8")).toBe(own);
    expect(code).toBe(1); // the task settings are still missing
  });
});

describe("agents sync: omp task settings", () => {
  // spec: specfold-agents-sync#team-settings-kept
  it("sets the four task keys and keeps the team's keys and comments (team settings kept)", async () => {
    const root = repo(OMP);
    mkdirSync(join(root, ".omp"), { recursive: true });
    const team = "# team settings\nmodelRoles:\n  smol: anthropic/claude-haiku # fast\n";
    writeFileSync(join(root, ".omp/config.yml"), team);
    const { code, out } = await syncJson(root);
    expect(code).toBe(0);
    expect(out.actions).toEqual([
      { path: ".omp/config.yml", action: "set", target: "task.maxRecursionDepth: 1" },
      { path: ".omp/config.yml", action: "set", target: "task.isolation.enabled: true" },
      { path: ".omp/config.yml", action: "set", target: "task.isolation.merge: branch" },
      { path: ".omp/config.yml", action: "set", target: "task.isolation.apply: false" },
    ]);
    const text = readFileSync(join(root, ".omp/config.yml"), "utf8");
    expect(text).toContain("# team settings");
    expect(text).toContain("# fast");
    expect(parse(text)).toEqual({
      modelRoles: { smol: "anthropic/claude-haiku" },
      task: { maxRecursionDepth: 1, isolation: { enabled: true, merge: "branch", apply: false } },
    });
    expect((await syncJson(root, ["--check"])).out.actions).toEqual([]);
  });

  it("creates .omp/config.yml when it is missing", async () => {
    const root = repo(OMP);
    await syncJson(root);
    expect(parse(readFileSync(join(root, ".omp/config.yml"), "utf8")).task.isolation.merge).toBe("branch");
  });

  it("exits with 2 and changes nothing when .omp/config.yml is not a mapping", async () => {
    const root = repo(OMP, { scout: SCOUT });
    mkdirSync(join(root, ".omp"), { recursive: true });
    writeFileSync(join(root, ".omp/config.yml"), "- a\n- b\n");
    const result = await run(["agents", "sync"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(".omp/config.yml");
    expect(readFileSync(join(root, ".omp/config.yml"), "utf8")).toBe("- a\n- b\n");
    expect(existsSync(join(root, ".omp/agents"))).toBe(false);
  });
});
