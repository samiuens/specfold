import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UsageError } from "../src/errors.ts";
import { dueDate, findItem, listItems, setKeys } from "../src/future/items.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

const item = (type: string, extra = "") =>
  `---\ntype: ${type}\ntitle: Dark mode\ndescription: An idea.\nstatus: draft\n${extra}generated: { by: x/y, at: 2026-10-01T00:00:00Z }\n---\n\n# Idea\n`;

function repo(): string {
  const root = tempDir();
  write(root, "specfold.yaml", "types: [Backlog Item, Deferred Commitment]\n");
  write(root, "knowledge/backlog/dark-mode.md", item("Backlog Item", "state: open\n"));
  write(root, "knowledge/backlog/nested/later.md", item("Backlog Item"));
  write(root, "knowledge/backlog/note.md", item("Term"));
  write(root, "knowledge/domain/stray.md", item("Backlog Item"));
  return root;
}

describe("future items", () => {
  it("lists the kind's concepts inside its folder", () => {
    const root = repo();
    expect(listItems(join(root, "knowledge"), "backlog").map((i) => i.rel)).toEqual([
      "backlog/dark-mode.md",
      "backlog/nested/later.md",
    ]);
  });

  it("finds an item by name, file name or path, and names an unknown one", () => {
    const root = repo();
    const bundle = join(root, "knowledge");
    for (const arg of ["dark-mode", "dark-mode.md", "backlog/dark-mode.md", "knowledge/backlog/dark-mode.md"])
      expect(findItem(root, bundle, "backlog", arg).rel, arg).toBe("backlog/dark-mode.md");
    expect(() => findItem(root, bundle, "backlog", "note")).toThrow(UsageError);
    expect(() => findItem(root, bundle, "commitments", "dark-mode")).toThrow(
      /unknown commitment 'dark-mode'/,
    );
  });

  it("parses date and timestamp triggers and treats conditions as undated", () => {
    expect(dueDate("2026-12-01")).toEqual(new Date(2026, 11, 1));
    expect(dueDate("2026-12-01T10:00:00Z")).toEqual(new Date("2026-12-01T10:00:00Z"));
    expect(dueDate("before 1.0")).toBeUndefined();
    expect(dueDate("2026-13-99x")).toBeUndefined();
    expect(dueDate(undefined)).toBeUndefined();
  });

  it("sets keys in place", () => {
    const root = repo();
    const target = findItem(root, join(root, "knowledge"), "backlog", "dark-mode");
    setKeys(target.abs, { state: "dropped", reason: "no demand" });
    expect(readFileSync(target.abs, "utf8")).toContain("state: dropped\nreason: no demand\n");
  });
});
