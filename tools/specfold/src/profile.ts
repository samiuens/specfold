import type { Profile } from "./repo.ts";

/** Kit-owned path prefixes the knowledge profile leaves out: everything that only serves OpenSpec. */
const KNOWLEDGE_EXCLUDED = [
  "openspec/",
  ".agents/skills/sf-plan/",
  ".agents/skills/sf-apply/",
  ".agents/skills/sf-sync/",
];

/** Whether a repository-relative path belongs to the profile's file set. */
export function inProfile(path: string, profile: Profile): boolean {
  if (profile === "full") return true;
  if (KNOWLEDGE_EXCLUDED.some((prefix) => path.startsWith(prefix))) return false;
  if (path.startsWith(".claude/agents/")) return path === ".claude/agents/scout.md";
  return true;
}

/** The paths of a list that belong to the profile's file set, in order. */
export function profileFiles(paths: string[], profile: Profile): string[] {
  return paths.filter((p) => inProfile(p, profile));
}
