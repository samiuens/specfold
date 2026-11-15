import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import specfold, { type OmpContext } from "../../../template/.specfold/tools/omp/hooks/pre/specfold.ts";
import { tempDir } from "./helpers.ts";

interface Reply {
  code: number;
  stdout?: string;
  stderr?: string;
}

interface Call {
  args: string[];
  input: unknown;
}

/** A stand-in for scripts/specfold.mjs: records each call and answers from replies.json per subcommand. */
const STUB_CLI = `import { appendFileSync, readFileSync } from "node:fs";
const args = process.argv.slice(2);
const input = JSON.parse(readFileSync(0, "utf8"));
appendFileSync("calls.jsonl", JSON.stringify({ args, input }) + "\\n");
const reply = JSON.parse(readFileSync("replies.json", "utf8"))[args[1]] ?? { code: 0 };
process.stdout.write(reply.stdout ?? "");
process.stderr.write(reply.stderr ?? "");
process.exitCode = reply.code;
`;

const PUSH_REASON = "pushing and pull requests are the orchestrator's job; return your branch name instead";
const BROKEN_CONCEPT = "knowledge/decisions/x.md:1 OKF-2 frontmatter has no non-empty 'type'";

/** A temporary Specfold repository; with replies, it holds a stub CLI answering with them. */
function repo(replies?: Record<string, Reply>): string {
  const root = tempDir();
  writeFileSync(join(root, "specfold.yaml"), "bundle_root: knowledge\n");
  if (replies) {
    mkdirSync(join(root, "scripts"));
    writeFileSync(join(root, "scripts", "specfold.mjs"), STUB_CLI);
    writeFileSync(join(root, "replies.json"), JSON.stringify(replies));
  }
  return root;
}

/** The CLI calls the stub recorded, in order. */
function calls(root: string): Call[] {
  const file = join(root, "calls.jsonl");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Call);
}

const mainSession = (root: string, id = "main-1"): OmpContext => ({
  sessionManager: { getCwd: () => root, getSessionId: () => id, getHeader: () => ({}) },
});

const subagentSession = (root: string): OmpContext => ({
  sessionManager: {
    getCwd: () => root,
    getSessionId: () => "sub-1",
    getHeader: () => ({ parentSession: "/sessions/main-1.jsonl" }),
  },
});

type Handler = (event: object, ctx: OmpContext) => unknown;

/** Loads the adapter into a fake `pi` and returns a function that fires one omp event at it. */
function omp() {
  const handlers = new Map<string, Handler>();
  specfold({
    on: (event, handler) => {
      handlers.set(event, handler as Handler);
    },
  });
  return (event: string, payload: object, ctx: OmpContext) => handlers.get(event)?.(payload, ctx);
}

const write = (path: string) => ({
  toolName: "write",
  input: { path, content: "---\ntitle: X\n---\n" },
  isError: false,
});
const bash = (command: string) => ({ toolName: "bash", input: { command } });
const read = (path: string) => ({ toolName: "read", input: { path } });

describe("omp hook adapter", () => {
  // spec: specfold-hooks#cli-missing
  it("starts without Specfold context and blocks nothing when the CLI is missing", () => {
    const failing: Reply = { code: 1, stderr: "Error: boom\n" };
    const broken = repo({
      "claude-session-start": failing,
      "claude-post-tool-use": failing,
      "claude-stop": failing,
      "claude-no-push": failing,
    });
    for (const root of [repo(), broken]) {
      const fire = omp();
      const push = bash("git push origin add-export");
      expect(fire("before_agent_start", {}, mainSession(root))).toBeUndefined();
      expect(fire("tool_result", write("knowledge/decisions/x.md"), mainSession(root))).toBeUndefined();
      expect(fire("tool_call", push, subagentSession(root))).toBeUndefined();
      expect(fire("session_stop", {}, mainSession(root))).toBeUndefined();
    }
    expect(calls(broken).map((c) => c.args[1])).toEqual([
      "claude-session-start",
      "claude-post-tool-use",
      "claude-no-push",
      "claude-stop",
    ]);
  });

  // spec: specfold-hooks#context-at-start
  it("injects the session-start output once per main session and not in subagents", () => {
    const stdout = [
      "Knowledge sections (look up with: node scripts/specfold.mjs lookup <words>):",
      "* [Domain](domain/) - Terms",
      "Active changes: add-a, add-b",
      "",
    ].join("\n");
    const root = repo({ "claude-session-start": { code: 0, stdout } });
    const fire = omp();
    const injected = { message: { customType: "specfold", content: stdout.trimEnd(), display: false } };
    expect(fire("before_agent_start", {}, mainSession(root))).toEqual(injected);
    // before_agent_start fires again after a blocked stop; the context is not injected twice
    expect(fire("before_agent_start", {}, mainSession(root))).toBeUndefined();
    expect(fire("before_agent_start", {}, subagentSession(root))).toBeUndefined();
    expect(fire("before_agent_start", {}, mainSession(root, "main-2"))).toEqual(injected);
    const start = { args: ["hook", "claude-session-start"], input: { cwd: root } };
    expect(calls(root)).toEqual([start, start]);
  });

  // spec: specfold-hooks#agent-writes-a-broken-concept-in-omp
  it("adds the validate error of a written concept to the agent's next step", () => {
    const root = repo({ "claude-post-tool-use": { code: 2, stderr: `${BROKEN_CONCEPT}\n` } });
    const result = omp()("tool_result", write("knowledge/decisions/x.md"), mainSession(root));
    expect(result).toEqual({ additionalContext: BROKEN_CONCEPT });
    const input = { tool_name: "Write", tool_input: { file_path: "knowledge/decisions/x.md" }, cwd: root };
    expect(calls(root)).toEqual([{ args: ["hook", "claude-post-tool-use"], input }]);
  });

  it("checks each path of an edit and skips failed calls and other tools", () => {
    const root = repo({ "claude-post-tool-use": { code: 0 } });
    const fire = omp();
    const edit = { toolName: "edit", input: { paths: ["knowledge/a.md", "openspec/changes/x/brief.md"] } };
    const failed = { ...write("knowledge/b.md"), isError: true };
    expect(fire("tool_result", edit, mainSession(root))).toBeUndefined();
    expect(fire("tool_result", failed, mainSession(root))).toBeUndefined();
    expect(fire("tool_result", read("knowledge/c.md"), mainSession(root))).toBeUndefined();
    expect(calls(root).map((c) => c.input)).toEqual([
      { tool_name: "Edit", tool_input: { file_path: "knowledge/a.md" }, cwd: root },
      { tool_name: "Edit", tool_input: { file_path: "openspec/changes/x/brief.md" }, cwd: root },
    ]);
  });

  // spec: specfold-hooks#unfinished-work-in-omp
  it("blocks the stop with the G13 finding as the reason", () => {
    const finding = "block G13 openspec/changes/demo/brief.md:1 brief.md is not confirmed";
    const root = repo({ "claude-stop": { code: 2, stderr: `gate: blocked\n${finding}\n` } });
    const result = omp()("session_stop", {}, mainSession(root));
    expect(result).toEqual({ decision: "block", reason: `gate: blocked\n${finding}` });
    expect(calls(root)).toEqual([{ args: ["hook", "claude-stop"], input: {} }]);
  });

  // spec: specfold-hooks#clean-stop
  it("lets the session stop when the local gate has no blocking finding", () => {
    const root = repo({ "claude-stop": { code: 0 } });
    expect(omp()("session_stop", {}, mainSession(root))).toBeUndefined();
    expect(calls(root).map((c) => c.args)).toEqual([["hook", "claude-stop"]]);
  });

  // spec: specfold-hooks#subagent-push-refused
  it("blocks a subagent's push with the orchestrator reason", () => {
    const root = repo({ "claude-no-push": { code: 2, stderr: `${PUSH_REASON}\n` } });
    const fire = omp();
    const command = "npm test && git push origin add-export";
    const result = fire("tool_call", bash(command), subagentSession(root));
    expect(result).toEqual({ block: true, reason: PUSH_REASON });
    expect(fire("tool_call", read("a.md"), subagentSession(root))).toBeUndefined();
    expect(calls(root)).toEqual([{ args: ["hook", "claude-no-push"], input: { tool_input: { command } } }]);
  });

  // spec: specfold-hooks#main-session-push-left-to-permissions
  it("leaves a main session's push to bash.patterns", () => {
    const root = repo({ "claude-no-push": { code: 2, stderr: `${PUSH_REASON}\n` } });
    expect(omp()("tool_call", bash("git push origin add-export"), mainSession(root))).toBeUndefined();
    expect(calls(root)).toEqual([]);
  });
});
