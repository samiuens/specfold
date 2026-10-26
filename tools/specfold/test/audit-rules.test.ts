import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { auditBundle } from "../src/audit/rules.ts";
import { requireConfig } from "../src/repo.ts";
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
});
