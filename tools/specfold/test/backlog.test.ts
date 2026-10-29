import { existsSync, readFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

const KIT_NODE_MODULES = fileURLToPath(new URL("../../../node_modules", import.meta.url));

const item = (title: string, keys: string) =>
  `---\ntype: Backlog Item\ntitle: ${title}\ndescription: An idea.\nstatus: draft\n${keys}\ngenerated: { by: x/y, at: 2026-10-01T00:00:00Z }\n---\n\n# Idea\n\nText.\n`;

function repo(): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Backlog Item]\nactors:\n  agent_prefix: claude-code/\n");
  write(
    root,
    "knowledge/backlog/dark-mode.md",
    item("Dark mode", "state: open\npriority: low\norigin: human"),
  );
  write(root, "knowledge/backlog/offline.md", item("Offline", "state: open\npriority: high\norigin: retro"));
  write(
    root,
    "knowledge/backlog/old.md",
    item("Old", "state: dropped\npriority: high\norigin: human\nreason: no"),
  );
  return root;
}

const frontmatter = (root: string, rel: string) =>
  parse(readFileSync(join(root, rel), "utf8").split("---\n")[1] ?? "", { schema: "core" }) as Record<
    string,
    unknown
  >;

describe("specfold backlog", () => {
  // spec: specfold-backlog#unknown-item
  it("exits 2 for an unknown item or subcommand", async () => {
    const result = await run(["backlog", "drop", "nope", "--reason", "x"], repo());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("'nope'");
    for (const argv of [["backlog"], ["backlog", "move", "x"], ["backlog", "add"]])
      expect((await run(argv, repo())).code, argv.join(" ")).toBe(2);
  });

  // spec: specfold-backlog#long-description
  it("refuses a description over 160 characters", async () => {
    const root = repo();
    const result = await run(["backlog", "add", "Night theme", "--description", "x".repeat(200)], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("the description has 200 characters (max 160)");
    expect(existsSync(join(root, "knowledge/backlog/night-theme.md"))).toBe(false);
  });

  // spec: specfold-backlog#long-title-without-a-description
  it("refuses a long title used as the description and suggests --description", async () => {
    const root = repo();
    const title = Array.from({ length: 34 }, (_, i) => `word${i % 10}`).join(" ");
    const result = await run(["backlog", "add", title], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(
      `the title, used as the description, has ${title.length} characters (max 160); pass a shorter --description`,
    );
  });

  // spec: specfold-backlog#long-title-with-a-short-description
  it("accepts a long title with a short description", async () => {
    const root = repo();
    const title = Array.from({ length: 34 }, (_, i) => `word${i % 10}`).join(" ");
    const result = await run(["backlog", "add", title, "--description", "A short summary."], root);
    expect(result.code).toBe(0);
    const created = result.stdout.match(/created (\S+)/)?.[1] ?? "";
    expect(frontmatter(root, created)).toMatchObject({ title, description: "A short summary." });
  });

  // spec: specfold-backlog#idea-from-an-interview
  it("adds an item and regenerates the indexes", async () => {
    vi.stubEnv("SPECFOLD_MODEL", "opus");
    const root = repo();
    const result = await run(["backlog", "add", "Dark", "theme", "--origin", "interview"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("created knowledge/backlog/dark-theme.md\n");
    expect(frontmatter(root, "knowledge/backlog/dark-theme.md")).toMatchObject({
      type: "Backlog Item",
      title: "Dark theme",
      state: "open",
      priority: "medium",
      origin: "interview",
      generated: { by: "claude-code/opus" },
    });
    expect(readFileSync(join(root, "knowledge/backlog/index.md"), "utf8")).toContain("(dark-theme.md)");
    expect((await run(["validate"], root)).code).toBe(0);
    expect((await run(["backlog", "add", "Dark theme"], root)).code).toBe(1);
  });

  it("takes a priority and defaults the origin to the actor", async () => {
    vi.stubEnv("SPECFOLD_MODEL", "");
    const root = repo();
    expect((await run(["backlog", "add", "Sync", "--priority", "high"], root)).code).toBe(0);
    expect(frontmatter(root, "knowledge/backlog/sync.md")).toMatchObject({
      priority: "high",
      origin: "process:specfold-backlog",
    });
    expect((await run(["backlog", "add", "Sync2", "--priority", "urgent"], root)).code).toBe(2);
  });

  // spec: specfold-backlog#open-items-only
  it("lists open items by priority, or other states on request", async () => {
    const root = repo();
    expect((await run(["backlog", "list"], root)).stdout).toBe(
      "open  high  knowledge/backlog/offline.md    Offline\nopen  low   knowledge/backlog/dark-mode.md  Dark mode\n",
    );
    expect((await run(["backlog", "list", "--state", "dropped"], root)).stdout).toContain("old.md");
    const all = JSON.parse((await run(["backlog", "list", "--state", "all", "--json"], root)).stdout);
    expect(all.items.map((i: { path: string }) => i.path)).toEqual([
      "knowledge/backlog/offline.md",
      "knowledge/backlog/old.md",
      "knowledge/backlog/dark-mode.md",
    ]);
  });

  // spec: specfold-backlog#item-promoted
  it("promotes an open item to a new change without a brief", async () => {
    const root = repo();
    symlinkSync(KIT_NODE_MODULES, join(root, "node_modules"));
    const result = await run(["backlog", "promote", "dark-mode", "--name", "add-dark-mode"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(result.stdout).toBe(
      "created openspec/changes/add-dark-mode/\nknowledge/backlog/dark-mode.md: state promoted, change add-dark-mode\nnext: run the planning interview (sf-interview) for add-dark-mode, seeded with knowledge/backlog/dark-mode.md\n",
    );
    expect(existsSync(join(root, "openspec/changes/add-dark-mode/.openspec.yaml"))).toBe(true);
    expect(existsSync(join(root, "openspec/changes/add-dark-mode/brief.md"))).toBe(false);
    expect(frontmatter(root, "knowledge/backlog/dark-mode.md")).toMatchObject({
      state: "promoted",
      change: "add-dark-mode",
    });
  });

  // spec: specfold-backlog#already-promoted
  it("refuses an item that is not open and creates no change", async () => {
    const root = repo();
    write(
      root,
      "knowledge/backlog/dark-mode.md",
      item("Dark mode", "state: promoted\npriority: low\norigin: human\nchange: add-dark-mode"),
    );
    const result = await run(["backlog", "promote", "dark-mode", "--name", "add-dark-mode-2"], root);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("only open items are promoted");
    expect(existsSync(join(root, "openspec"))).toBe(false);
  });

  it("changes nothing when openspec is missing", async () => {
    vi.stubEnv("PATH", "/nonexistent");
    const root = repo();
    const result = await run(["backlog", "promote", "dark-mode"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("openspec is not installed");
    expect(frontmatter(root, "knowledge/backlog/dark-mode.md").state).toBe("open");
  });

  // spec: specfold-backlog#idea-dropped
  it("drops an open item with a reason", async () => {
    const root = repo();
    expect((await run(["backlog", "drop", "dark-mode"], root)).code).toBe(2);
    const result = await run(
      ["backlog", "drop", "knowledge/backlog/dark-mode.md", "--reason", "no demand"],
      root,
    );
    expect(result).toEqual({
      code: 0,
      stdout: "knowledge/backlog/dark-mode.md: state dropped\n",
      stderr: "",
    });
    expect(frontmatter(root, "knowledge/backlog/dark-mode.md")).toMatchObject({
      state: "dropped",
      reason: "no demand",
    });
    expect((await run(["backlog", "drop", "old", "--reason", "x"], root)).code).toBe(1);
  });
});
