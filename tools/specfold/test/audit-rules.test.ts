import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { auditBundle } from "../src/audit/rules.ts";
import { requireConfig } from "../src/repo.ts";
import { commitAt } from "./drift-helpers.ts";
import { git } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const NOW = new Date("2026-10-26T12:00:00Z");
const FRESH = "2026-10-25T10:00:00+01:00";

const write = (root: string, rel: string, content: string) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
};

const concept = (fm: string, body = "") => `---\n${fm}\n---\n\n${body}`;

/** A repository whose two concepts link to each other, so the bundle starts clean. */
function repo(): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Term, Decision, Capability, Vision]\nsource_globs: ['src/**']\n");
  write(
    root,
    "knowledge/domain/ledger.md",
    concept(
      `type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`,
      "See [account](/domain/account.md).\n",
    ),
  );
  write(
    root,
    "knowledge/domain/account.md",
    concept(`type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`, "See [ledger](ledger.md).\n"),
  );
  return root;
}

const audit = (root: string) => auditBundle(requireConfig(root), join(root, "knowledge"), NOW);
const rules = (root: string) => audit(root).map((f) => [f.rule, f.path]);

describe("auditBundle", () => {
  it("reports nothing for a clean bundle", () => {
    expect(audit(repo())).toEqual([]);
  });

  // spec: specfold-audit#expired-reference
  it("A1: reports a concept past stale_after", () => {
    const root = repo();
    write(
      root,
      "knowledge/domain/ledger.md",
      concept(
        `type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }\nstale_after: 2020-01-01T00:00:00Z`,
        "[a](/domain/account.md)\n",
      ),
    );
    expect(audit(root)).toEqual([
      expect.objectContaining({
        rule: "A1",
        severity: "warning",
        path: "domain/ledger.md",
        line: 5,
        message: "stale since 2020-01-01T00:00:00Z",
      }),
    ]);
  });

  // spec: specfold-audit#old-draft
  it("A2: reports a concept unverified for longer than the limit", () => {
    const root = repo();
    write(
      root,
      "knowledge/domain/ledger.md",
      concept(
        "type: Term\nstatus: draft\ngenerated: { by: x/y, at: 2020-01-01T00:00:00Z }",
        "[a](/domain/account.md)\n",
      ),
    );
    expect(audit(root)).toEqual([expect.objectContaining({ rule: "A2", path: "domain/ledger.md", line: 4 })]);
  });

  // spec: specfold-audit#fresh-draft
  it("A2: leaves fresh and verified concepts alone, and honors the configured limit", () => {
    const root = repo();
    write(
      root,
      "knowledge/domain/ledger.md",
      concept(
        "type: Term\nstatus: stable\ngenerated: { by: x/y, at: 2020-01-01T00:00:00Z }\nverified: { by: human:ana, at: 2020-02-01T00:00:00Z }",
        "[a](/domain/account.md)\n",
      ),
    );
    expect(audit(root)).toEqual([]);
    write(
      root,
      "knowledge/domain/ledger.md",
      concept(
        "type: Term\nstatus: draft\ngenerated: { by: x/y, at: 2026-09-01T00:00:00Z }",
        "[a](/domain/account.md)\n",
      ),
    );
    expect(rules(root)).toEqual([["A2", "domain/ledger.md"]]);
    write(root, "specfold.yaml", "types: [Term]\naudit:\n  unverified_after_days: 90\n");
    expect(audit(root)).toEqual([]);
  });

  // spec: specfold-audit#link-to-deprecated-decision
  it("A3: reports a link to a deprecated concept on the linking concept", () => {
    const root = repo();
    write(
      root,
      "knowledge/decisions/old-checkout.md",
      concept(
        `type: Decision\nstatus: deprecated\ngenerated: { by: x/y, at: ${FRESH} }`,
        "See [ledger](/domain/ledger.md).\n",
      ),
    );
    write(
      root,
      "knowledge/domain/account.md",
      concept(
        `type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`,
        "See [ledger](ledger.md).\n\nOld: [checkout](/decisions/old-checkout.md).\n",
      ),
    );
    expect(audit(root)).toEqual([
      expect.objectContaining({
        rule: "A3",
        path: "domain/account.md",
        line: 9,
        message: "links to deprecated concept /decisions/old-checkout.md",
      }),
    ]);
  });

  // spec: specfold-audit#unlinked-term
  it("A4: reports a concept only an index links to", () => {
    const root = repo();
    write(
      root,
      "knowledge/domain/fee.md",
      concept(
        `type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`,
        "Links to [ledger](ledger.md) do not count for fee.\n",
      ),
    );
    write(root, "knowledge/domain/index.md", "# Terms\n\n* [Fee](fee.md)\n");
    expect(rules(root)).toEqual([["A4", "domain/fee.md"]]);
  });

  // spec: specfold-audit#referenced-from-code
  it("A4: counts code references and exempts vision and capability cards with a spec", () => {
    const root = repo();
    write(
      root,
      "knowledge/decisions/retries.md",
      concept(`type: Decision\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`),
    );
    write(root, "src/client.ts", "// see knowledge: /decisions/retries.md\n");
    write(
      root,
      "knowledge/vision/goals.md",
      concept(`type: Vision\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`),
    );
    write(root, "openspec/specs/checkout/spec.md", "# checkout\n");
    write(
      root,
      "knowledge/capabilities/checkout.md",
      concept(
        `type: Capability\nstatus: draft\nspec: openspec/specs/checkout/spec.md\ngenerated: { by: x/y, at: ${FRESH} }`,
      ),
    );
    expect(audit(root)).toEqual([]);
  });

  // spec: specfold-audit#named-in-agents-md
  it("A4: counts concept paths named in AGENTS.md and CLAUDE.md", () => {
    const root = repo();
    write(
      root,
      "knowledge/conventions/code-comments.md",
      concept(`type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`),
    );
    write(
      root,
      "knowledge/decisions/style.md",
      concept(`type: Decision\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`),
    );
    expect(rules(root)).toEqual([
      ["A4", "conventions/code-comments.md"],
      ["A4", "decisions/style.md"],
    ]);
    write(root, "AGENTS.md", "Comments follow `/conventions/code-comments.md`.\n");
    write(root, "CLAUDE.md", "@AGENTS.md\n\nSee [style](/decisions/style.md).\n");
    expect(audit(root)).toEqual([]);
  });

  // spec: specfold-audit#backlog-item
  it("A4: exempts backlog items", () => {
    const root = repo();
    write(
      root,
      "knowledge/backlog/dark-mode.md",
      concept(`type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`),
    );
    expect(audit(root)).toEqual([]);
  });

  // spec: specfold-audit#missing-card
  it("A5: reports a main spec without a capability card", () => {
    const root = repo();
    write(root, "openspec/specs/checkout/spec.md", "# checkout\n");
    write(root, "openspec/specs/billing/invoices/spec.md", "# invoices\n");
    expect(audit(root)).toEqual([
      expect.objectContaining({
        rule: "A5",
        path: "openspec/specs/billing/invoices/spec.md",
        message: "spec 'billing/invoices' has no capability card",
      }),
      expect.objectContaining({ rule: "A5", path: "openspec/specs/checkout/spec.md", line: null }),
    ]);
  });

  const promise = (keys: string) =>
    concept(
      `type: Deferred Commitment\nstatus: draft\n${keys}\ngenerated: { by: x/y, at: ${FRESH} }`,
      "See [ledger](/domain/ledger.md).\n",
    );

  // spec: specfold-audit#promise-past-due
  it("A6: reports an open commitment past its trigger date", () => {
    const root = repo();
    write(
      root,
      "knowledge/commitments/eu.md",
      promise("state: open\ntrigger: 2020-01-01\nvision: /vision/v.md"),
    );
    write(
      root,
      "knowledge/commitments/done.md",
      promise("state: fulfilled\ntrigger: 2020-01-01\nvision: /vision/v.md"),
    );
    expect(audit(root).filter((f) => f.rule === "A6")).toEqual([
      expect.objectContaining({
        path: "commitments/eu.md",
        line: 5,
        message: "commitment was due on 2020-01-01",
      }),
    ]);
  });

  // spec: specfold-audit#condition-trigger
  it("A6: never reports a condition trigger or a future date", () => {
    const root = repo();
    write(
      root,
      "knowledge/commitments/a.md",
      promise("state: open\ntrigger: before 1.0\nvision: /vision/v.md"),
    );
    write(
      root,
      "knowledge/commitments/b.md",
      promise("state: open\ntrigger: 2099-01-01\nvision: /vision/v.md"),
    );
    expect(audit(root).filter((f) => f.rule === "A6")).toEqual([]);
  });

  // spec: specfold-audit#unanchored-promise
  it("A7: reports an open commitment without a vision", () => {
    const root = repo();
    write(root, "knowledge/commitments/eu.md", promise("state: open\ntrigger: before 1.0"));
    expect(rules(root).filter(([rule]) => rule === "A7")).toEqual([["A7", "commitments/eu.md"]]);
  });

  // spec: specfold-audit#old-idea
  it("A8: reports an open backlog item last committed too long ago", () => {
    const root = repo();
    git(root, "init", "-q", "-b", "main");
    const idea = (state: string) =>
      concept(`type: Term\nstatus: draft\ngenerated: { by: x/y, at: ${FRESH} }`).replace(
        "type: Term",
        `type: Backlog Item\nstate: ${state}\npriority: low\norigin: human`,
      );
    write(root, "specfold.yaml", "types: [Term, Backlog Item]\nsource_globs: ['src/**']\n");
    commitAt(root, "2026-04-01T00:00:00Z", {
      "knowledge/backlog/old.md": idea("open"),
      "knowledge/backlog/dropped.md": idea("dropped"),
    });
    write(root, "knowledge/backlog/new.md", idea("open"));
    expect(audit(root).filter((f) => f.rule === "A8")).toEqual([
      expect.objectContaining({
        path: "backlog/old.md",
        message: "open backlog item untouched for 208 days (limit 180)",
      }),
    ]);
    write(root, "specfold.yaml", "types: [Term, Backlog Item]\naudit:\n  backlog_untouched_days: 365\n");
    expect(audit(root).filter((f) => f.rule === "A8")).toEqual([]);
  });
});
