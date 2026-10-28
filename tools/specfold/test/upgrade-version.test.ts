import { describe, expect, it } from "vitest";
import { compareVersions, isVersion, onChannel, upgradePath } from "../src/upgrade/version.ts";

describe("upgrade versions", () => {
  it("orders prereleases below their release and compares numeric parts as numbers", () => {
    const sorted = ["0.1.0", "0.1.0-rc.10", "v0.1.0-rc.2", "0.0.9", "0.1.0-rc.1", "1.0.0"].sort(
      compareVersions,
    );
    expect(sorted).toEqual(["0.0.9", "0.1.0-rc.1", "v0.1.0-rc.2", "0.1.0-rc.10", "0.1.0", "1.0.0"]);
    expect(compareVersions("0.1.0-rc.2", "v0.1.0-rc.2")).toBe(0);
    expect(isVersion("dev")).toBe(false);
  });

  it("keeps only final releases on stable and release candidates too on next", () => {
    const all = ["0.1.0-rc.1", "0.1.0-rc.2", "0.1.0", "not-a-version"];
    expect(onChannel(all, "stable")).toEqual(["0.1.0"]);
    expect(onChannel(all, "next")).toEqual(["0.1.0-rc.1", "0.1.0-rc.2", "0.1.0"]);
  });

  it("steps to the newest release of the installed major first, then major by major", () => {
    const all = ["1.2.0", "1.5.0", "2.0.0", "2.3.0", "3.1.0", "3.2.0-rc.1"];
    expect(upgradePath("1.2.0", all, "stable")).toEqual(["1.5.0", "2.3.0", "3.1.0"]);
    expect(upgradePath("1.5.0", all, "next")).toEqual(["2.3.0", "3.2.0-rc.1"]);
    expect(upgradePath("3.1.0", all, "stable")).toEqual([]);
  });

  it("takes a release candidate to its final release on stable", () => {
    expect(upgradePath("0.1.0-rc.1", ["0.1.0-rc.2", "0.1.0"], "stable")).toEqual(["0.1.0"]);
    expect(upgradePath("0.1.0-rc.1", ["0.1.0-rc.2"], "stable")).toEqual([]);
  });
});
