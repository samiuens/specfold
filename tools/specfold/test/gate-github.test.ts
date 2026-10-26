import { describe, expect, it } from "vitest";
import { EnvError } from "../src/errors.ts";
import { approvers, fetchPullRequest } from "../src/gate/github.ts";
import { fakeGithub, review } from "./github-server.ts";

const REVIEWS = "/repos/acme/shop/pulls/7/reviews";

describe("gate: github", () => {
  // spec: specfold-gate#approval-withdrawn
  it("drops a reviewer whose later review requested changes or was dismissed", () => {
    expect(
      approvers([
        review("ben", "APPROVED"),
        review("ben", "CHANGES_REQUESTED"),
        review("dora", "APPROVED"),
        review("dora", "DISMISSED"),
        review("eve", "CHANGES_REQUESTED"),
        review("eve", "APPROVED"),
      ]),
    ).toEqual(["eve"]);
  });

  // spec: specfold-gate#comment-after-approval
  it("keeps an approval followed by a comment review", () => {
    expect(
      approvers([review("Ben", "APPROVED"), review("ben", "COMMENTED"), review("carl", "COMMENTED")]),
    ).toEqual(["ben"]);
  });

  it("reads the author and every review page", async () => {
    const first = Array.from({ length: 100 }, (_, i) => review(`r${i}`, "COMMENTED"));
    const gh = await fakeGithub({
      "/repos/acme/shop/pulls/7": { user: { login: "Ana" } },
      [`${REVIEWS}?per_page=100&page=1`]: first,
      [`${REVIEWS}?per_page=100&page=2`]: [review("ben", "APPROVED")],
    });
    const pr = await fetchPullRequest({ token: "t0k", repository: "acme/shop", apiUrl: `${gh.url}/` }, 7);
    expect(pr).toEqual({ number: 7, author: "ana", approvers: ["ben"] });
    expect(gh.requests).toHaveLength(3);
    expect(gh.auth.every((a) => a === "Bearer t0k")).toBe(true);
  });

  // spec: specfold-gate#missing-token
  it("requires a token and a repository", async () => {
    await expect(
      fetchPullRequest({ token: undefined, repository: "acme/shop", apiUrl: undefined }, 7),
    ).rejects.toThrow("GITHUB_TOKEN is required for --pr");
    await expect(
      fetchPullRequest({ token: "t", repository: undefined, apiUrl: undefined }, 7),
    ).rejects.toThrow("GITHUB_REPOSITORY");
  });

  it("fails on an error response without naming the token", async () => {
    const gh = await fakeGithub({ "/repos/acme/shop/pulls/7": 404 });
    const call = fetchPullRequest({ token: "s3cret", repository: "acme/shop", apiUrl: gh.url }, 7);
    await expect(call).rejects.toThrow(EnvError);
    await expect(call).rejects.toThrow(/GET \/repos\/acme\/shop\/pulls\/7 failed: 404/);
    await call.catch((e: Error) => expect(e.message).not.toContain("s3cret"));
  });
});
