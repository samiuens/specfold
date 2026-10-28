import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installKit, MANIFEST_PATH } from "../src/migrate/install.ts";
import { fixtureRepo, TEMPLATE } from "./migrate-helpers.ts";

const KIT_BIN = fileURLToPath(new URL("../../../node_modules/.bin", import.meta.url));

beforeEach(() => {
  vi.stubEnv("PATH", `${KIT_BIN}:${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

// `npx vitest -u` rewrites the template's manifest after a template change
it("ships the manifest an install into an empty repository records", async () => {
  const root = fixtureRepo();
  installKit({ root, from: TEMPLATE, tools: ["agents", "claude"] });
  await expect(readFileSync(join(root, MANIFEST_PATH), "utf8")).toMatchFileSnapshot(
    join(TEMPLATE, MANIFEST_PATH),
  );
});
