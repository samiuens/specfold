import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { openSource } from "../src/upgrade/source.ts";

const servers: Server[] = [];
afterEach(async () => {
  const open = servers.splice(0);
  for (const s of open) s.closeAllConnections();
  await Promise.all(open.map((s) => new Promise((resolve) => s.close(resolve))));
});

/** A server that accepts requests and never answers. */
async function silentServer(): Promise<string> {
  const server = createServer(() => {});
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
}

describe("release source time limit", () => {
  it("fails with an environment error when the source does not answer in time", async () => {
    const url = await silentServer();
    const started = Date.now();
    await expect(openSource({ url }, "/", { timeoutMs: 200 }).versions()).rejects.toThrow(EnvError);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
