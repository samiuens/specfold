import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface ThreeWay {
  text: string;
  conflict: boolean;
}

/**
 * Merges the changes from `base` to `next` into `local` with `git merge-file`; a conflict leaves the
 * usual markers, labelled `local`, `installed` and `new`.
 */
export function mergeThreeWay(local: string, base: string, next: string): ThreeWay {
  const dir = mkdtempSync(join(tmpdir(), "specfold-merge-"));
  try {
    const files = { local: join(dir, "local"), base: join(dir, "base"), next: join(dir, "next") };
    writeFileSync(files.local, local);
    writeFileSync(files.base, base);
    writeFileSync(files.next, next);
    const args = [
      "merge-file",
      "-p",
      "-L",
      "local",
      "-L",
      "installed",
      "-L",
      "new",
      files.local,
      files.base,
      files.next,
    ];
    try {
      return {
        text: execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
        conflict: false,
      };
    } catch (error) {
      // exit status is the number of conflicts; anything else (or a negative status) is a real failure
      const e = error as { status?: number; stdout?: string; stderr?: string };
      if (e.status && e.status > 0 && e.status < 128 && typeof e.stdout === "string")
        return { text: e.stdout, conflict: true };
      throw new Error(`git merge-file failed: ${String(e.stderr ?? "").trim()}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
