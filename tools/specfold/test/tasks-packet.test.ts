import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

const C = "openspec/changes/add-guest-checkout";
const group = (n: number, files: string, scenarios: string) =>
  `## ${n}. Group ${n}\n\n\`\`\`yaml\nfiles: [${files}]\ndepends: [${n > 1 ? n - 1 : ""}]\nscenarios: [${scenarios}]\nagent: implementer\n\`\`\`\n\n- [ ] ${n}.1 Step one of ${n}\n  - Done when: tests pass\n- [ ] ${n}.2 Step two of ${n}\n  - Done when: lint passes\n\n`;

function repo(): string {
  const root = tempDir("valid");
  write(
    root,
    `${C}/tasks.md`,
    `# Tasks\n\n${group(1, "src/order/**", "")}${group(2, "src/checkout/token/**", "checkout/guest-checkout#guest-pays-without-account, checkout/guest-checkout#gone")}${group(3, "knowledge/**", "")}`,
  );
  write(
    root,
    `${C}/brief.md`,
    "## Wish\n\nGuests pay without an account.\n\n## Decisions\n\n| # | Question | Answer | Source |\n| --- | --- | --- | --- |\n| Q1 | Token? | Email token | user |\n\n## Confirmation\n\nconfirmed_by: human:someone\n",
  );
  write(
    root,
    `${C}/proposal.md`,
    "# Proposal\n\nSee [guest](/decisions/use-yaml.md) and [again](/decisions/use-yaml.md).\n",
  );
  write(
    root,
    `${C}/specs/checkout/guest-checkout/spec.md`,
    "## ADDED Requirements\n\n### Requirement: Guest pays\nGuests SHALL pay.\n\n#### Scenario: Guest pays without account\n- **WHEN** a guest checks out\n- **THEN** an email token is issued\n\n#### Scenario: Other\n- **WHEN** x\n- **THEN** y\n",
  );
  return root;
}

describe("specfold tasks packet", () => {
  // spec: specfold-tasks#packet-for-a-group
  it("prints one group's tasks, files, scenarios, brief, knowledge and trailer", async () => {
    const result = await run(["tasks", "packet", "add-guest-checkout", "2"], repo());
    expect(result).toMatchObject({ code: 0, stderr: "" });
    const out = result.stdout;
    expect(out).toContain("# Task packet: add-guest-checkout, group 2. Group 2\n");
    expect(out).toContain("- 2.1 Step one of 2\n  - Done when: tests pass\n- 2.2 Step two of 2\n");
    expect(out).toContain("- `src/checkout/token/**`\n");
    expect(out).toContain("- group 1 (merged before you start)\n");
    expect(out).toContain(
      "### checkout/guest-checkout#guest-pays-without-account\n\n#### Scenario: Guest pays without account\n- **WHEN** a guest checks out\n- **THEN** an email token is issued\n",
    );
    expect(out).not.toContain("#### Scenario: Other");
    expect(out).toContain("### checkout/guest-checkout#gone\n\nunknown scenario id\n");
    expect(out).toContain("## Wish\n\nGuests pay without an account.\n");
    expect(out).toContain("| Q1 | Token? | Email token | user |");
    expect(out).toContain("## Knowledge\n\n- knowledge/decisions/use-yaml.md\n\n");
    expect(out).toContain("`Task: add-guest-checkout#2.<m>`");
    expect(out).not.toContain("Step one of 1");
  });

  // spec: specfold-tasks#finished-tasks-marked
  it("marks ticked tasks done and says where to start", async () => {
    const root = repo();
    const tasks = join(root, C, "tasks.md");
    writeFileSync(tasks, readFileSync(tasks, "utf8").replace("- [ ] 2.1 ", "- [x] 2.1 "));
    const out = (await run(["tasks", "packet", "add-guest-checkout", "2"], root)).stdout;
    expect(out).toContain("- [done] 2.1 Step one of 2\n");
    expect(out).toContain("- 2.2 Step two of 2\n");
    expect(out).toContain("Start at the first task not marked [done]");
    const data = JSON.parse(
      (await run(["tasks", "packet", "add-guest-checkout", "2", "--json"], root)).stdout,
    );
    expect(data.tasks.map((t: { done: boolean }) => t.done)).toEqual([true, false]);
  });

  // spec: specfold-tasks#unknown-group
  it("exits with 2 for an unknown group and names the existing ones", async () => {
    const result = await run(["tasks", "packet", "add-guest-checkout", "9"], repo());
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("has no group 9; its groups are 1, 2, 3");
    expect((await run(["tasks", "packet", "add-nothing", "1"], repo())).code).toBe(2);
  });

  it("gives the packet as JSON", async () => {
    const data = JSON.parse(
      (await run(["tasks", "packet", "add-guest-checkout", "1", "--json"], repo())).stdout,
    );
    expect(data).toMatchObject({ ok: true, group: 1, files: ["src/order/**"], depends: [], scenarios: [] });
  });
});
