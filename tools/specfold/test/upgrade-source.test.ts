import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fetchRelease, openSource, tarballName } from "../src/upgrade/source.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

/** A release tarball of `version` with one file, and its `.sha256`, in `dir`. */
function packRelease(dir: string, version: string): void {
  const stage = tempDir();
  write(stage, `specfold-template-v${version}/specfold.yaml`, `kit_version: ${version}\n`);
  const tarball = join(dir, tarballName(version));
  execFileSync("tar", ["-czf", tarball, "-C", stage, `specfold-template-v${version}`]);
  const hash = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  writeFileSync(`${tarball}.sha256`, `${hash}  ${tarballName(version)}\n`);
}

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((resolve) => s.close(resolve))));
});

/** Serves `routes` (path to text or a file path prefixed with `file:`) and records the auth headers. */
async function serve(routes: Record<string, string>) {
  const auth: (string | undefined)[] = [];
  const server = createServer((req, res) => {
    auth.push(req.headers.authorization);
    const body = routes[req.url ?? ""];
    if (body === undefined) return void res.writeHead(404).end();
    res.writeHead(200).end(body.startsWith("file:") ? readFileSync(body.slice(5)) : body);
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return { url: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`, auth };
}

describe("release sources", () => {
  it("lists a local folder's tarballs and unpacks a checked release", async () => {
    const dir = tempDir();
    packRelease(dir, "0.1.0-rc.1");
    packRelease(dir, "0.1.0-rc.2");
    const source = openSource({ path: dir }, "/");
    expect((await source.versions()).sort()).toEqual(["0.1.0-rc.1", "0.1.0-rc.2"]);
    const unpacked = await fetchRelease(source, "0.1.0-rc.2", tempDir());
    expect(readFileSync(join(unpacked, "specfold.yaml"), "utf8")).toBe("kit_version: 0.1.0-rc.2\n");
  });

  it("reads versions and notes from releases.json in a folder relative to the root", async () => {
    const root = tempDir();
    write(
      root,
      "mirror/releases.json",
      JSON.stringify({ releases: [{ version: "0.1.0-rc.2", notes: "rc.2 notes" }] }),
    );
    const source = openSource({ path: "mirror" }, root);
    expect(await source.versions()).toEqual(["0.1.0-rc.2"]);
    expect(await source.notes("0.1.0-rc.2")).toBe("rc.2 notes");
    await expect(openSource({ path: "missing" }, root).versions()).rejects.toThrow("does not exist");
  });

  // spec: specfold-upgrade#tampered-tarball
  it("stops on a tarball that does not match its checksum and unpacks nothing", async () => {
    const dir = tempDir();
    packRelease(dir, "0.1.0-rc.2");
    writeFileSync(join(dir, tarballName("0.1.0-rc.2")), "tampered");
    const work = tempDir();
    await expect(fetchRelease(openSource({ path: dir }, "/"), "0.1.0-rc.2", work)).rejects.toThrow(
      "does not match its .sha256",
    );
    expect(existsSync(join(work, "0.1.0-rc.2"))).toBe(false);
  });

  it("stops when the checksum file is missing", async () => {
    const dir = tempDir();
    packRelease(dir, "0.1.0-rc.2");
    const copy = tempDir();
    writeFileSync(join(copy, tarballName("0.1.0-rc.2")), readFileSync(join(dir, tarballName("0.1.0-rc.2"))));
    await expect(fetchRelease(openSource({ path: copy }, "/"), "0.1.0-rc.2", tempDir())).rejects.toThrow(
      "does not exist",
    );
  });

  it("reads releases.json and the release files from a url mirror", async () => {
    const dir = tempDir();
    packRelease(dir, "0.1.0-rc.2");
    const name = tarballName("0.1.0-rc.2");
    const mirror = await serve({
      "/kit/releases.json": JSON.stringify({ releases: [{ version: "0.1.0-rc.2", notes: "notes" }] }),
      [`/kit/${name}`]: `file:${join(dir, name)}`,
      [`/kit/${name}.sha256`]: `file:${join(dir, name)}.sha256`,
    });
    const source = openSource({ url: `${mirror.url}/kit/` }, "/");
    expect(await source.versions()).toEqual(["0.1.0-rc.2"]);
    expect(await source.notes("0.1.0-rc.2")).toBe("notes");
    expect(existsSync(join(await fetchRelease(source, "0.1.0-rc.2", tempDir()), "specfold.yaml"))).toBe(true);
  });

  it("uses the GitHub API with a token from the environment when gh is not used", async () => {
    const dir = tempDir();
    packRelease(dir, "0.1.0-rc.2");
    const name = tarballName("0.1.0-rc.2");
    const routes: Record<string, string> = {
      "/assets/1": `file:${join(dir, name)}`,
      "/assets/2": `file:${join(dir, name)}.sha256`,
    };
    const api = await serve(routes);
    routes["/repos/acme/kit/releases?per_page=100"] = JSON.stringify([
      {
        tag_name: "v0.1.0-rc.2",
        body: "changelog",
        assets: [
          { name, url: `${api.url}/assets/1` },
          { name: `${name}.sha256`, url: `${api.url}/assets/2` },
        ],
      },
      { tag_name: "nightly" },
    ]);
    const source = openSource({ github: "acme/kit" }, "/", {
      gh: false,
      env: { GITHUB_API_URL: api.url, SPECFOLD_TOKEN: "secret" },
    });
    expect(await source.versions()).toEqual(["0.1.0-rc.2"]);
    expect(await source.notes("0.1.0-rc.2")).toBe("changelog");
    expect(source.tag("0.1.0-rc.2")).toBe("v0.1.0-rc.2");
    await fetchRelease(source, "0.1.0-rc.2", tempDir());
    expect(api.auth.every((a) => a === "Bearer secret")).toBe(true);
  });
});
