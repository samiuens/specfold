import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";
import { main } from "../src/cli.ts";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Runs the CLI in-process with captured output. */
export async function run(argv: string[], cwd: string): Promise<RunResult> {
  let stdout = "";
  let stderr = "";
  const code = await main(argv, {
    cwd,
    stdout: (t) => {
      stdout += t;
    },
    stderr: (t) => {
      stderr += t;
    },
  });
  return { code, stdout, stderr };
}

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A fresh temporary directory, removed after the test; optionally seeded with a fixture copy. */
export function tempDir(fixture?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "specfold-"));
  temps.push(dir);
  if (fixture) cpSync(new URL(`./fixtures/${fixture}`, import.meta.url), dir, { recursive: true });
  return dir;
}
