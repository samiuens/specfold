import { chmodSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commit, concept, demoChange, gateRepo, git, write, writeIndexes } from "./gate-helpers.ts";
import { run } from "./helpers.ts";

const event = (root: string, tool: string, file: string) =>
  JSON.stringify({
    hook_event_name: "PostToolUse",
    cwd: root,
    tool_name: tool,
    tool_input: { file_path: join(root, file) },
  });

describe("hook: Claude Code", () => {
  // spec: specfold-hooks#context-at-start
  it("prints the knowledge sections and the active changes", async () => {
    const root = gateRepo();
    write(root, "openspec/changes/add-a/proposal.md", "x\n");
    write(root, "openspec/changes/add-b/proposal.md", "x\n");
    write(root, "openspec/changes/archive/2026-01-01-old/proposal.md", "x\n");
    const result = await run(["hook", "claude-session-start"], root);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("* [Domain](domain/)");
    expect(result.stdout).toContain("Active changes: add-a, add-b\n");
    expect(result.stdout.split("\n").length).toBeLessThanOrEqual(41);
  });

  // spec: specfold-hooks#commitments-due
  it("counts the open commitments due within 30 days", async () => {
    const root = gateRepo();
    const day = (offset: number) => {
      const d = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const promise = (keys: string) =>
      concept("Term", "Promise.").replace("type: Term", `type: Deferred Commitment\n${keys}`);
    write(root, "knowledge/commitments/soon.md", promise(`state: open\ntrigger: ${day(10)}`));
    expect((await run(["hook", "claude-session-start"], root)).stdout).toContain(
      "Commitments due within 30 days: 1 (specfold commitments list)\n",
    );
    write(root, "knowledge/commitments/soon.md", promise(`state: open\ntrigger: ${day(60)}`));
    write(root, "knowledge/commitments/kept.md", promise(`state: fulfilled\ntrigger: ${day(1)}`));
    write(root, "knowledge/commitments/later.md", promise("state: open\ntrigger: before 1.0"));
    expect((await run(["hook", "claude-session-start"], root)).stdout).not.toContain("Commitments due");
  });

  it("cuts the output to 40 lines", async () => {
    const root = gateRepo();
    for (let i = 0; i < 50; i++)
      write(root, `knowledge/s${String(i).padStart(2, "0")}/x.md`, concept("Term", "x"));
    writeIndexes(root);
    const lines = (await run(["hook", "claude-session-start"], root)).stdout.trimEnd().split("\n");
    expect(lines).toHaveLength(40);
    expect(lines.at(-1)).toMatch(/^\.\.\. \d+ more lines$/);
  });

  // spec: specfold-hooks#agent-writes-a-broken-concept
  it("reports a broken concept after Write with exit 2", async () => {
    const root = gateRepo();
    write(root, "knowledge/decisions/x.md", "---\ntitle: X\n---\n");
    const result = await run(
      ["hook", "claude-post-tool-use"],
      root,
      event(root, "Write", "knowledge/decisions/x.md"),
    );
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("knowledge/decisions/x.md:1 OKF-2 frontmatter has no non-empty 'type'");
    expect(result.stdout).toBe("");
  });

  it("checks an edited change as planned and stays silent otherwise", async () => {
    const root = gateRepo();
    const files = demoChange();
    delete files["openspec/changes/demo/tasks.md"];
    delete files["openspec/changes/demo/knowledge.md"];
    for (const [rel, content] of Object.entries(files)) write(root, rel, content);
    const edit = (file: string, tool = "Edit") =>
      run(["hook", "claude-post-tool-use"], root, event(root, tool, file));
    expect(await edit("openspec/changes/demo/brief.md")).toEqual({ code: 0, stdout: "", stderr: "" });
    write(root, "knowledge/domain/a.md", "---\ntitle: broken\n---\n");
    expect((await edit("knowledge/domain/a.md", "Read")).code).toBe(0);
    expect((await edit("src/app.ts")).code).toBe(0);
    expect((await run(["hook", "claude-post-tool-use"], root, "not json")).code).toBe(0);
    write(root, "openspec/changes/demo/brief.md", "## Wish\n");
    const result = await edit("openspec/changes/demo/brief.md");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("openspec/changes/demo/brief.md");
  });

  // spec: specfold-hooks#unfinished-work
  it("blocks stopping while a touched change has an unconfirmed brief", async () => {
    const root = gateRepo();
    write(root, "node_modules/.bin/openspec", "#!/bin/sh\necho '{\"itemFindings\": []}'\n");
    chmodSync(join(root, "node_modules/.bin/openspec"), 0o755);
    git(root, "update-ref", "refs/remotes/origin/main", "main");
    const files = demoChange();
    files["openspec/changes/demo/brief.md"] = (files["openspec/changes/demo/brief.md"] as string).replace(
      "confirmed_by: human:samiuens",
      "confirmed_by:",
    );
    for (const [rel, content] of Object.entries(files)) write(root, rel, content);
    writeIndexes(root);
    const stdin = JSON.stringify({ hook_event_name: "Stop", stop_hook_active: true });
    const result = await run(["hook", "claude-stop"], root, stdin);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("block G13 openspec/changes/demo/brief.md");
    commit(root, {
      "openspec/changes/demo/brief.md": files["openspec/changes/demo/brief.md"].replace(
        "confirmed_by:",
        "confirmed_by: human:samiuens",
      ),
    });
    expect(await run(["hook", "claude-stop"], root, stdin)).toEqual({ code: 0, stdout: "", stderr: "" });
  });
});
