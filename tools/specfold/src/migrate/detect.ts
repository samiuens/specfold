import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface Detection {
  /** Ecosystems found at the root, in a fixed order; empty when none is known. */
  stack: string[];
  layout: "monorepo" | "single package";
  ci: string[];
  sourceGlobs: string[];
  /** True when no code folder was found and `sourceGlobs` is the `src/**` fallback. */
  globsFallback: boolean;
}

const STACK: [string[], string][] = [
  [["package.json"], "Node.js"],
  [["tsconfig.json"], "TypeScript"],
  [["pyproject.toml", "requirements.txt", "setup.py"], "Python"],
  [["go.mod"], "Go"],
  [["Cargo.toml"], "Rust"],
  [["pom.xml", "build.gradle", "build.gradle.kts"], "Java"],
  [["Gemfile"], "Ruby"],
  [["composer.json"], "PHP"],
  [["mix.exs"], "Elixir"],
];

const CI: [string, string][] = [
  [".github/workflows", "GitHub Actions"],
  [".gitlab-ci.yml", "GitLab CI"],
  [".circleci", "CircleCI"],
  ["Jenkinsfile", "Jenkins"],
  ["azure-pipelines.yml", "Azure Pipelines"],
];

const CODE_FOLDERS: [string, string][] = [
  ["src", "src/**"],
  ["lib", "lib/**"],
  ["app", "app/**"],
  ["packages", "packages/*/src/**"],
  ["apps", "apps/*/src/**"],
];

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function patterns(value: unknown): string[] {
  const list = Array.isArray(value) ? value : (value as { packages?: unknown } | null)?.packages;
  return Array.isArray(list) ? list.filter((p): p is string => typeof p === "string") : [];
}

const hasWorkspaces = (root: string) =>
  (readJson(join(root, "package.json")) as { workspaces?: unknown } | undefined)?.workspaces !== undefined;

/** Workspace patterns of package.json and pnpm-workspace.yaml as `<pattern>/src/**`; negations are skipped. */
function workspaceGlobs(root: string): string[] {
  const found = patterns(
    (readJson(join(root, "package.json")) as { workspaces?: unknown } | undefined)?.workspaces,
  );
  try {
    found.push(...patterns(parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"))));
  } catch {
    // no or unreadable pnpm-workspace.yaml
  }
  const globs = found
    .filter((p) => !p.startsWith("!"))
    .map((p) => `${p.replace(/^\.\//, "").replace(/\/+$/, "")}/src/**`);
  return [...new Set(globs)];
}

/** Stack, layout, CI system and source globs from the files and folders at the repository root. */
export function detect(root: string): Detection {
  const has = (p: string) => existsSync(join(root, p));
  const workspaces = workspaceGlobs(root);
  const globs =
    workspaces.length > 0 ? workspaces : CODE_FOLDERS.filter(([dir]) => has(dir)).map(([, glob]) => glob);
  return {
    stack: STACK.filter(([files]) => files.some(has)).map(([, name]) => name),
    layout:
      hasWorkspaces(root) || has("pnpm-workspace.yaml") || has("go.work") ? "monorepo" : "single package",
    ci: CI.filter(([path]) => has(path)).map(([, name]) => name),
    sourceGlobs: globs.length > 0 ? globs : ["src/**"],
    globsFallback: globs.length === 0,
  };
}
