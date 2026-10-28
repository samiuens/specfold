import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyLinks, listSkills, planLinks } from "../agents/sync.ts";
import { EnvError } from "../errors.ts";
import { mergeSettings } from "../migrate/merge.ts";
import type { Config } from "../repo.ts";

// see knowledge: /decisions/graphify-code-only.md

export const SKILL_FILE = ".agents/skills/graphify/SKILL.md";
export const IGNORE_FILE = ".graphifyignore";
export const GRAPH_FILE = "graphify-out/graph.json";
const SETTINGS_FILE = ".claude/settings.json";

const IGNORE = `# Specfold already serves knowledge/ and openspec/; generated and vendored files only cost tokens.
knowledge/
openspec/
.specfold/
scripts/specfold.mjs
graphify-out/
node_modules/
dist/
build/
coverage/
`;

/** graphify's own guard, skipped on machines without graphify so teammates get no hook errors. */
export const guardCommand = (mode: "search" | "read") =>
  `if command -v graphify >/dev/null 2>&1; then graphify hook-guard ${mode}; fi`;

const GUARD = `${JSON.stringify(
  {
    hooks: {
      PreToolUse: [
        { matcher: "Bash|Grep", hooks: [{ type: "command", command: guardCommand("search"), timeout: 10 }] },
        { matcher: "Read|Glob", hooks: [{ type: "command", command: guardCommand("read"), timeout: 10 }] },
      ],
    },
  },
  null,
  2,
)}\n`;

export interface SetupResult {
  actions: { path: string; action: string }[];
}

function graphify(root: string, args: string[]): void {
  try {
    execFileSync("graphify", args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GRAPHIFY_BACKEND: "none" },
    });
  } catch (error) {
    const reason = String((error as { stderr?: unknown }).stderr ?? "")
      .trim()
      .split("\n")
      .at(-1);
    throw new EnvError(`graphify ${args[0]} failed${reason ? `: ${reason}` : ""}`);
  }
}

/** Sets up graphify code-only: its skill, an ignore file, the Claude Code guard and the first graph. */
export function setupGraphify(config: Config): SetupResult {
  const root = config.root;
  const abs = (p: string) => join(root, p);
  try {
    execFileSync("graphify", ["--version"], { stdio: "ignore" });
  } catch {
    throw new EnvError(
      "graphify is not installed: install it with `uv tool install graphifyy`, then run setup again",
    );
  }
  const claude = config.agentTargets.includes(".claude/skills");
  const current = existsSync(abs(SETTINGS_FILE)) ? readFileSync(abs(SETTINGS_FILE), "utf8") : undefined;
  const settings = claude ? mergeSettings(current, GUARD) : undefined;
  if (settings && "conflict" in settings)
    throw new EnvError(`${SETTINGS_FILE} ${settings.conflict}; nothing was written`);

  const result: SetupResult = { actions: [] };
  const act = (path: string, action: string) => result.actions.push({ path, action });

  if (!existsSync(abs(SKILL_FILE))) {
    graphify(root, ["install", "--project", "--platform", "agents"]);
    act(".agents/skills/graphify/", "run graphify install --project --platform agents");
  }
  const skills = listSkills(root);
  if (skills) {
    const links = planLinks(root, skills, config.agentTargets).filter((l) => l.action !== "kept");
    applyLinks(root, links);
    for (const l of links) act(l.path, l.action);
  }
  if (!existsSync(abs(IGNORE_FILE))) {
    writeFileSync(abs(IGNORE_FILE), IGNORE);
    act(IGNORE_FILE, "write");
  }
  if (settings && !("conflict" in settings) && settings.changed) {
    writeFileSync(abs(SETTINGS_FILE), settings.text);
    act(SETTINGS_FILE, current === undefined ? "write" : "merge");
  }
  if (!existsSync(abs(GRAPH_FILE))) {
    graphify(root, ["extract", ".", "--code-only"]);
    graphify(root, ["cluster-only", ".", "--no-label"]);
    act("graphify-out/", "run graphify extract --code-only");
  }
  return result;
}
