import { describe, expect, it } from "vitest";
import { run, tempDir } from "./helpers.ts";

const bash = (command: string) =>
  JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command } });

describe("specfold hook claude-no-push", () => {
  // spec: specfold-hooks#push-refused
  it("refuses git push and gh pr anywhere in the command", async () => {
    const root = tempDir("valid");
    for (const command of [
      "npm test && git push origin add-export",
      "git -C ../repo push",
      "git status; gh pr create --fill",
      "FOO=1 git push --force",
      "echo ok |\ngit push",
    ]) {
      const result = await run(["hook", "claude-no-push"], root, bash(command));
      expect([command, result.code]).toEqual([command, 2]);
      expect(result.stderr).toBe(
        "pushing and pull requests are the orchestrator's job; return your branch name instead\n",
      );
    }
  });

  // spec: specfold-hooks#other-commands-pass
  it("lets every other command and event through silently", async () => {
    const root = tempDir("valid");
    for (const stdin of [
      bash('git commit -m "feat: add export"'),
      bash("gh issue list && echo push"),
      bash("git log --grep push"),
      JSON.stringify({ tool_name: "Read", tool_input: { file_path: "a.md" } }),
      "not json",
    ]) {
      const result = await run(["hook", "claude-no-push"], root, stdin);
      expect(result).toEqual({ code: 0, stdout: "", stderr: "" });
    }
  });
});
