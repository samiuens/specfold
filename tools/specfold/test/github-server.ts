import { createServer, type Server } from "node:http";
import { afterEach } from "vitest";

export interface FakeGithub {
  url: string;
  /** Request paths in order, with query strings. */
  requests: string[];
  /** Authorization headers in order. */
  auth: (string | undefined)[];
}

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((resolve) => s.close(resolve))));
});

/** A local stand-in for the GitHub REST API: `routes` maps a path (with query) to a JSON body or a status. */
export async function fakeGithub(routes: Record<string, unknown>): Promise<FakeGithub> {
  const fake: FakeGithub = { url: "", requests: [], auth: [] };
  const server = createServer((req, res) => {
    fake.requests.push(req.url ?? "");
    fake.auth.push(req.headers.authorization);
    const body = routes[req.url ?? ""];
    if (body === undefined || typeof body === "number") {
      res.writeHead(typeof body === "number" ? body : 404).end("{}");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  fake.url = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  return fake;
}

export const review = (login: string, state: string) => ({ user: { login }, state });
