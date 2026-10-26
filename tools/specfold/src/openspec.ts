import { existsSync } from "node:fs";
import { join } from "node:path";

export interface OpenSpecBinary {
  /** Absolute path of the repository-local binary, or `openspec` to resolve from the PATH. */
  command: string;
  source: "node_modules/.bin" | "PATH";
}

/** The repository's `node_modules/.bin/openspec` when it exists, otherwise `openspec` from the PATH. */
export function openspecBinary(root: string | undefined): OpenSpecBinary {
  const local = root ? join(root, "node_modules", ".bin", "openspec") : undefined;
  return local !== undefined && existsSync(local)
    ? { command: local, source: "node_modules/.bin" }
    : { command: "openspec", source: "PATH" };
}
