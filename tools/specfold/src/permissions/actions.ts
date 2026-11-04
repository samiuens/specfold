// see knowledge: /capabilities/specfold-permissions.md
// A release that changes or drops a pattern moves the old one to RETIRED, so the sync removes it.

export const ACTIONS = [
  "push",
  "force-push",
  "delete-remote-branch",
  "push-tags",
  "open-pr",
  "merge-pr",
  "close-pr",
] as const;

export type ActionName = (typeof ACTIONS)[number];

export interface Action {
  name: ActionName;
  /** The action whose rule also matches every command of this one; it must be at least as strict. */
  parent?: ActionName;
  /** Claude Code Bash rules, in the order the sync appends them. */
  patterns: string[];
}

export const ACTION_TABLE: Action[] = [
  { name: "push", patterns: ["Bash(git push *)"] },
  {
    name: "force-push",
    parent: "push",
    patterns: [
      "Bash(git push *--force*)",
      "Bash(git push -f*)",
      "Bash(git push * -f*)",
      "Bash(git push * +*)",
    ],
  },
  {
    name: "delete-remote-branch",
    parent: "push",
    patterns: ["Bash(git push *--delete*)", "Bash(git push -d *)", "Bash(git push * -d *)"],
  },
  {
    name: "push-tags",
    parent: "push",
    patterns: ["Bash(git push *--tags*)", "Bash(git push *--follow-tags*)"],
  },
  { name: "open-pr", patterns: ["Bash(gh pr create *)"] },
  { name: "merge-pr", patterns: ["Bash(gh pr merge *)", "Bash(gh api *pulls/*/merge*)"] },
  { name: "close-pr", patterns: ["Bash(gh pr close *)", "Bash(gh api *pulls/*state=closed*)"] },
];

/** Patterns earlier releases generated and later dropped; the sync removes them from every list. */
export const RETIRED: string[] = [];

/** Every pattern the sync owns; the settings merges of migrate and upgrade leave these to it. */
export const OWNED = new Set([...ACTION_TABLE.flatMap((a) => a.patterns), ...RETIRED]);
