import { describe, expect, it } from "vitest";
import { insertEntry } from "../src/log/insert.ts";

const LOG = "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-01\n\n* **Creation**: First.\n";

describe("log: insertion", () => {
  it("appends to an existing date section", () => {
    expect(insertEntry(LOG, "2026-10-26", "* **Update**: Third.")).toBe(
      "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n* **Update**: Third.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("appends to the last section without leaving a gap", () => {
    expect(insertEntry(LOG, "2026-10-01", "* **Update**: Later.")).toBe(`${LOG}* **Update**: Later.\n`);
  });

  it("inserts a newer date above the newest heading", () => {
    expect(insertEntry(LOG, "2026-10-27", "* **Update**: New.")).toBe(
      "# Log\n\n## 2026-10-27\n\n* **Update**: New.\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("inserts a back-dated section between older and newer dates", () => {
    expect(insertEntry(LOG, "2026-10-10", "* **Update**: Middle.")).toBe(
      "# Log\n\n## 2026-10-26\n\n* **Update**: Second.\n\n## 2026-10-10\n\n* **Update**: Middle.\n\n## 2026-10-01\n\n* **Creation**: First.\n",
    );
  });

  it("appends the oldest date at the end", () => {
    expect(insertEntry(LOG, "2026-09-01", "* **Update**: Old.")).toBe(
      `${LOG}\n## 2026-09-01\n\n* **Update**: Old.\n`,
    );
  });

  it("fills an empty date section after one blank line", () => {
    expect(insertEntry("# Log\n\n## 2026-10-26\n", "2026-10-26", "* x")).toBe(
      "# Log\n\n## 2026-10-26\n\n* x\n",
    );
  });

  it("creates a new log", () => {
    expect(insertEntry(undefined, "2026-10-26", "* x")).toBe("# Log\n\n## 2026-10-26\n\n* x\n");
  });

  it("keeps a title and prose before the first heading", () => {
    expect(insertEntry("# History\n\nNotes.\n", "2026-10-26", "* x")).toBe(
      "# History\n\nNotes.\n\n## 2026-10-26\n\n* x\n",
    );
  });
});
