import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { system } from "../src/verify/login.ts";
import { write } from "./gate-helpers.ts";
import { run, tempDir } from "./helpers.ts";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const commitment = (title: string, keys: string) =>
  `---\ntype: Deferred Commitment\ntitle: ${title}\ndescription: A promise.\nstatus: draft\n${keys}\ngenerated: { by: x/y, at: 2026-10-01T00:00:00Z }\n---\n\n# Commitment\n\nText.\n`;

function repo(): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Deferred Commitment]\n");
  write(root, "knowledge/commitments/eu-data.md", commitment("EU data", "state: open\ntrigger: before 1.0"));
  write(
    root,
    "knowledge/commitments/a11y.md",
    commitment("Accessibility", "state: open\ntrigger: 2026-12-01"),
  );
  write(root, "knowledge/commitments/sso.md", commitment("SSO", "state: fulfilled\ntrigger: 2026-11-01"));
  return root;
}

const frontmatter = (root: string, rel: string) =>
  parse(readFileSync(join(root, rel), "utf8").split("---\n")[1] ?? "", { schema: "core" }) as Record<
    string,
    unknown
  >;

/** A person at a terminal whose GitHub login is `ana`. */
function asHuman() {
  vi.stubEnv("CLAUDECODE", "");
  vi.stubEnv("SPECFOLD_MODEL", "");
  vi.spyOn(system, "isInteractive").mockReturnValue(true);
  vi.spyOn(system, "ghLogin").mockReturnValue("ana");
}

describe("specfold commitments", () => {
  // spec: specfold-commitments#missing-reason
  it("exits 2 without a reason, a change or a known subcommand", async () => {
    const root = repo();
    for (const argv of [
      ["commitments", "withdraw", "eu-data"],
      ["commitments", "fulfill", "eu-data"],
      ["commitments"],
      ["commitments", "keep", "eu-data"],
      ["commitments", "fulfill", "nope", "--change", "add-x"],
    ])
      expect((await run(argv, root)).code, argv.join(" ")).toBe(2);
  });

  // spec: specfold-commitments#due-first
  it("lists open commitments with dated ones first", async () => {
    expect((await run(["commitments", "list"], repo())).stdout).toBe(
      "open  2026-12-01  knowledge/commitments/a11y.md     Accessibility (trigger: 2026-12-01)\nopen  -           knowledge/commitments/eu-data.md  EU data (trigger: before 1.0)\n",
    );
    const all = JSON.parse((await run(["commitments", "list", "--state", "all", "--json"], repo())).stdout);
    expect(all.commitments.map((c: { path: string; due: string | null }) => [c.path, c.due])).toEqual([
      ["knowledge/commitments/sso.md", "2026-11-01"],
      ["knowledge/commitments/a11y.md", "2026-12-01"],
      ["knowledge/commitments/eu-data.md", null],
    ]);
  });

  // spec: specfold-commitments#kept-by-a-change
  it("fulfills an open commitment, for agents too", async () => {
    vi.stubEnv("CLAUDECODE", "1");
    const root = repo();
    const result = await run(["commitments", "fulfill", "eu-data", "--change", "add-eu-region"], root);
    expect(result.stdout).toBe("knowledge/commitments/eu-data.md: state fulfilled, change add-eu-region\n");
    expect(frontmatter(root, "knowledge/commitments/eu-data.md")).toMatchObject({
      state: "fulfilled",
      change: "add-eu-region",
    });
    expect((await run(["commitments", "fulfill", "sso", "--change", "add-x"], root)).code).toBe(1);
  });

  // spec: specfold-commitments#withdrawn-by-a-human
  it("withdraws for a human and records the verification, leaving status alone", async () => {
    asHuman();
    const root = repo();
    const result = await run(["commitments", "withdraw", "eu-data", "--reason", "market dropped"], root);
    expect(result).toMatchObject({
      code: 0,
      stdout: "knowledge/commitments/eu-data.md: state withdrawn, verified by human:ana\n",
    });
    const data = frontmatter(root, "knowledge/commitments/eu-data.md");
    expect(data).toMatchObject({ state: "withdrawn", reason: "market dropped", status: "draft" });
    expect(data.verified).toMatchObject({ by: "human:ana" });
    expect((await run(["commitments", "withdraw", "sso", "--reason", "x"], root)).code).toBe(1);
  });

  // spec: specfold-commitments#withdrawn-by-an-agent
  it("refuses to withdraw for an agent and writes nothing", async () => {
    asHuman();
    vi.stubEnv("CLAUDECODE", "1");
    const root = repo();
    const before = readFileSync(join(root, "knowledge/commitments/eu-data.md"), "utf8");
    const result = await run(["commitments", "withdraw", "eu-data", "--reason", "market dropped"], root);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("only humans withdraw commitments (CLAUDECODE is set)");
    expect(readFileSync(join(root, "knowledge/commitments/eu-data.md"), "utf8")).toBe(before);
  });
});
