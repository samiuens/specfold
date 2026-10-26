import { EnvError } from "../errors.ts";

export interface GithubEnv {
  token: string | undefined;
  /** `owner/repo`. */
  repository: string | undefined;
  apiUrl: string | undefined;
}

export interface PullRequest {
  number: number;
  /** Lowercased login of the PR author. */
  author: string;
  /** Lowercased logins whose latest non-comment review is APPROVED. */
  approvers: string[];
}

interface Review {
  user?: { login?: unknown } | null;
  state?: unknown;
}

const PAGE = 100;
// Comment reviews and the author's own pending review don't change a reviewer's approval state.
const IGNORED = new Set(["COMMENTED", "PENDING"]);

export const githubEnv = (env: NodeJS.ProcessEnv = process.env): GithubEnv => ({
  token: env.GITHUB_TOKEN,
  repository: env.GITHUB_REPOSITORY,
  apiUrl: env.GITHUB_API_URL,
});

/** Reviewers whose latest review, ignoring comments, is APPROVED; reviews in chronological order. */
export function approvers(reviews: Review[]): string[] {
  const latest = new Map<string, string>();
  for (const r of reviews) {
    const login = r.user?.login;
    if (typeof login !== "string" || typeof r.state !== "string" || IGNORED.has(r.state)) continue;
    latest.set(login.toLowerCase(), r.state);
  }
  return [...latest].filter(([, state]) => state === "APPROVED").map(([login]) => login);
}

/** The PR's author and approvers from the GitHub REST API; any failure is an environment error. */
export async function fetchPullRequest(env: GithubEnv, number: number): Promise<PullRequest> {
  if (!env.token) throw new EnvError("GITHUB_TOKEN is required for --pr");
  if (!env.repository || !/^[^/\s]+\/[^/\s]+$/.test(env.repository))
    throw new EnvError("GITHUB_REPOSITORY (owner/repo) is required for --pr");
  const base = (env.apiUrl || "https://api.github.com").replace(/\/+$/, "");
  const get = async (path: string): Promise<unknown> => {
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "specfold-gate",
        },
      });
    } catch (error) {
      throw new EnvError(`GitHub request GET ${path} failed: ${(error as Error).message}`);
    }
    if (!response.ok)
      throw new EnvError(`GitHub request GET ${path} failed: ${response.status} ${response.statusText}`);
    return response.json();
  };

  const pull = (await get(`/repos/${env.repository}/pulls/${number}`)) as { user?: { login?: unknown } };
  const author = pull.user?.login;
  if (typeof author !== "string") throw new EnvError(`GitHub returned no author for pull request ${number}`);
  const reviews: Review[] = [];
  for (let page = 1; ; page++) {
    const batch = await get(`/repos/${env.repository}/pulls/${number}/reviews?per_page=${PAGE}&page=${page}`);
    if (!Array.isArray(batch))
      throw new EnvError(`GitHub returned no review list for pull request ${number}`);
    reviews.push(...(batch as Review[]));
    if (batch.length < PAGE) break;
  }
  return { number, author: author.toLowerCase(), approvers: approvers(reviews) };
}
