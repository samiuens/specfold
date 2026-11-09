// see knowledge: /decisions/upgrade-file-classes.md
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { MANIFEST_PATH, manifestText } from "../migrate/install.ts";
import { CONFIG_FILE } from "../repo.ts";
import type { UpgradePlan } from "./plan.ts";

/** `kit_version` set to `version` by a line edit that keeps quotes and the comment; unchanged without the key. */
export const setKitVersion = (text: string, version: string) =>
  text.replace(/^(kit_version:\s*)("?)[^"\s#]+("?)/m, `$1$2${version}$3`);

/**
 * Writes `plan` into `root`: kit files, blocks and config merges, `kit_version` and the manifest. Files the
 * plan keeps or leaves in conflict without a merge result stay as they are; nothing else is touched.
 */
export function applyPlan(root: string, plan: UpgradePlan, ref: string | undefined): void {
  const put = (p: string, data: Buffer | string, mode?: number) => {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), data);
    if (mode !== undefined) chmodSync(join(root, p), mode);
  };
  for (const f of plan.files) {
    if (f.action === "remove") rmSync(join(root, f.path), { force: true });
    else if (f.data !== undefined) put(f.path, f.data, f.mode);
  }
  for (const step of [...plan.blocks, ...plan.configs])
    if (step.text !== undefined) put(step.path, step.text);
  const settings = join(root, CONFIG_FILE);
  if (existsSync(settings)) put(CONFIG_FILE, setKitVersion(readFileSync(settings, "utf8"), plan.to));
  put(MANIFEST_PATH, manifestText(plan.to, ref, plan.manifest, plan.profile));
}
