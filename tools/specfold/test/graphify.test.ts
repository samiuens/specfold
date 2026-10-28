import { chmodSync, existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { guardCommand } from "../src/graphify/setup.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

/** A fake graphify that logs each call with its backend and writes what the real one would. */
function stubGraphify(): { bin: string; log: string } {
  const bin = tempDir();
  const log = join(bin, "calls.log");
  write(
    bin,
    "graphify",
    `#!/bin/sh
echo "$GRAPHIFY_BACKEND $*" >> "${log}"
case "$1" in
  --version) echo "graphify 0.9.97" ;;
  install) mkdir -p .agents/skills/graphify && printf -- '---\\nname: graphify\\ndescription: Query the code graph.\\n---\\n' > .agents/skills/graphify/SKILL.md ;;
  extract) mkdir -p graphify-out && echo '{}' > graphify-out/graph.json ;;
  cluster-only) echo '# Report' > graphify-out/GRAPH_REPORT.md ;;
esac
`,
  );
  chmodSync(join(bin, "graphify"), 0o755);
  return { bin, log };
}

const read = (root: string, p: string) => readFileSync(join(root, p), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("specfold graphify setup", () => {
  // spec: specfold-graphify#graphify-missing
  it("refuses without graphify and writes nothing", async () => {
    const root = tempDir("valid");
    vi.stubEnv("PATH", tempDir());
    const result = await run(["graphify", "setup"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("graphify is not installed: install it with `uv tool install graphifyy`");
    expect(existsSync(join(root, ".graphifyignore"))).toBe(false);
  });

  it("refuses settings it cannot merge, before any write", async () => {
    const root = tempDir("valid");
    write(root, ".claude/settings.json", "{ nope");
    vi.stubEnv("PATH", `${stubGraphify().bin}:${process.env.PATH}`);
    const result = await run(["graphify", "setup"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(".claude/settings.json is not valid JSON; nothing was written");
    expect(existsSync(join(root, ".graphifyignore"))).toBe(false);
  });

  // spec: specfold-graphify#fresh-repository
  it("installs the skill, links it and writes the ignore file, leaving the agent files alone", async () => {
    const root = tempDir("valid");
    write(root, "AGENTS.md", "# Rules\n");
    write(root, "CLAUDE.md", "@AGENTS.md\n");
    vi.stubEnv("PATH", `${stubGraphify().bin}:${process.env.PATH}`);
    const result = await run(["graphify", "setup"], root);
    expect(result).toMatchObject({ code: 0, stderr: "" });
    expect(existsSync(join(root, ".agents/skills/graphify/SKILL.md"))).toBe(true);
    expect(lstatSync(join(root, ".claude/skills/graphify")).isSymbolicLink()).toBe(true);
    expect(read(root, ".graphifyignore")).toContain("knowledge/\nopenspec/\n");
    expect(read(root, "AGENTS.md")).toBe("# Rules\n");
    expect(read(root, "CLAUDE.md")).toBe("@AGENTS.md\n");
    expect(result.stdout).toMatch(/^graphify setup: \d+ changes$/m);
  });

  it("keeps an existing .graphifyignore", async () => {
    const root = tempDir("valid");
    write(root, ".graphifyignore", "vendor/\n");
    vi.stubEnv("PATH", `${stubGraphify().bin}:${process.env.PATH}`);
    await run(["graphify", "setup"], root);
    expect(read(root, ".graphifyignore")).toBe("vendor/\n");
  });

  // spec: specfold-graphify#guard-added-once
  it("adds graphify's guard once and keeps Specfold's hooks", async () => {
    const root = tempDir("valid");
    write(
      root,
      ".claude/settings.json",
      `${JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "specfold stop" }] }] } })}\n`,
    );
    vi.stubEnv("PATH", `${stubGraphify().bin}:${process.env.PATH}`);
    await run(["graphify", "setup"], root);
    await run(["graphify", "setup"], root);
    const hooks = JSON.parse(read(root, ".claude/settings.json")).hooks;
    expect(hooks.Stop[0].hooks[0].command).toBe("specfold stop");
    expect(hooks.PreToolUse).toEqual([
      { matcher: "Bash|Grep", hooks: [{ type: "command", command: guardCommand("search"), timeout: 10 }] },
      { matcher: "Read|Glob", hooks: [{ type: "command", command: guardCommand("read"), timeout: 10 }] },
    ]);
  });

  it("adds no guard without Claude Code", async () => {
    const root = tempDir("valid");
    write(root, "specfold.yaml", `${read(root, "specfold.yaml")}\nagents:\n  targets: []\n`);
    vi.stubEnv("PATH", `${stubGraphify().bin}:${process.env.PATH}`);
    await run(["graphify", "setup"], root);
    expect(existsSync(join(root, ".claude/settings.json"))).toBe(false);
  });

  // spec: specfold-graphify#first-build
  it("builds the graph code-only with no backend", async () => {
    const root = tempDir("valid");
    const { bin, log } = stubGraphify();
    vi.stubEnv("PATH", `${bin}:${process.env.PATH}`);
    await run(["graphify", "setup"], root);
    expect(existsSync(join(root, "graphify-out/graph.json"))).toBe(true);
    const calls = readFileSync(log, "utf8").trim().split("\n");
    expect(calls.slice(1)).toEqual([
      "none install --project --platform agents",
      "none extract . --code-only",
      "none cluster-only . --no-label",
    ]);
  });

  // spec: specfold-graphify#rerun
  it("changes nothing on a second run", async () => {
    const root = tempDir("valid");
    const { bin, log } = stubGraphify();
    vi.stubEnv("PATH", `${bin}:${process.env.PATH}`);
    await run(["graphify", "setup"], root);
    const before = readFileSync(log, "utf8");
    const result = await run(["graphify", "setup"], root);
    expect(result.stdout).toBe("graphify setup: everything is up to date\n");
    expect(readFileSync(log, "utf8").slice(before.length).trim()).toBe("--version");
  });
});
