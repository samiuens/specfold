import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { register } from "../src/cli.ts";
import { run, tempDir } from "./helpers.ts";

register({
  name: "echo-test",
  summary: "test command",
  usage: "specfold echo-test [--loud] <word>",
  options: { loud: { type: "boolean" } },
  run: ({ io, values, positionals }) => {
    io.stdout(`${values.loud ? positionals.join(" ").toUpperCase() : positionals.join(" ")}\n`);
    return 0;
  },
});

describe("cli", () => {
  it("prints the package version", async () => {
    const result = await run(["--version"], tempDir());
    expect(result).toEqual({ code: 0, stdout: `${pkg.version}\n`, stderr: "" });
  });

  it("lists commands in --help", async () => {
    const result = await run(["--help"], tempDir());
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("echo-test");
  });

  it("exits with 2 without a command", async () => {
    expect((await run([], tempDir())).code).toBe(2);
  });

  it("exits with 2 on an unknown command", async () => {
    const result = await run(["nope"], tempDir());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown command 'nope'");
  });

  it("exits with 2 on an unknown flag", async () => {
    const result = await run(["echo-test", "--quiet", "x"], tempDir());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--quiet");
  });

  it("passes flags and positionals to the command", async () => {
    expect(await run(["echo-test", "--loud", "hi"], tempDir())).toEqual({
      code: 0,
      stdout: "HI\n",
      stderr: "",
    });
  });
});
