import { afterEach, describe, expect, it, vi } from "vitest";
import { EnvError } from "../src/errors.ts";
import { resolveLogin, system } from "../src/verify/login.ts";
import { write } from "./gate-helpers.ts";
import { tempDir } from "./helpers.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verify: login", () => {
  it("prefers the GitHub CLI login", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: other\n");
    vi.spyOn(system, "ghLogin").mockReturnValue("ana");
    expect(resolveLogin(root)).toBe("ana");
  });

  it("falls back to actors.github_login in .specfold/local.yaml", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: ben-x\n");
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(resolveLogin(root)).toBe("ben-x");
  });

  // spec: specfold-verify#no-login-available
  it("names both ways when no login is found", () => {
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(() => resolveLogin(tempDir())).toThrow(EnvError);
    expect(() => resolveLogin(tempDir())).toThrow(
      /gh auth login.*actors\.github_login in \.specfold\/local\.yaml/,
    );
  });

  it("rejects a value that is not a GitHub login", () => {
    const root = tempDir();
    write(root, ".specfold/local.yaml", "actors:\n  github_login: 'human:ana'\n");
    vi.spyOn(system, "ghLogin").mockReturnValue(undefined);
    expect(() => resolveLogin(root)).toThrow("'human:ana' is not a GitHub login");
  });
});
