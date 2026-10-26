import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { register } from "../cli.ts";
import { UsageError } from "../errors.ts";
import { resolveBundleRoot } from "../repo.ts";
import { insertEntry } from "./insert.ts";

const KIND = /^[A-Z][A-Za-z]*$/;

function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

register({
  name: "log",
  summary: "add a dated entry to the bundle's log.md",
  usage: "specfold log add [--kind <Kind>] [--date <YYYY-MM-DD>] [--bundle <dir>] <message...>",
  options: { kind: { type: "string" }, date: { type: "string" }, bundle: { type: "string" } },
  run: ({ io, values, positionals }) => {
    const [sub, ...words] = positionals;
    if (sub !== "add")
      throw new UsageError(sub ? `unknown log subcommand '${sub}'` : "missing subcommand: specfold log add");
    const message = words.join(" ").replace(/\s+/g, " ").trim();
    if (!message) throw new UsageError("missing message");
    const kind = (values.kind as string | undefined) ?? "Update";
    if (!KIND.test(kind))
      throw new UsageError(`kind '${kind}' must be one word starting with an uppercase letter`);
    const date = (values.date as string | undefined) ?? localDate();
    if (!isCalendarDate(date)) throw new UsageError(`date '${date}' is not a valid YYYY-MM-DD date`);

    const bundleRoot = resolveBundleRoot(io.cwd, values.bundle as string | undefined, undefined);
    const path = join(bundleRoot, "log.md");
    const entry = `* **${kind}**: ${message}`;
    writeFileSync(path, insertEntry(existsSync(path) ? readFileSync(path, "utf8") : undefined, date, entry));
    io.stdout(`${entry}\n`);
    return 0;
  },
});
