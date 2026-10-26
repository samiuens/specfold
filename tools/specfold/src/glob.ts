import { readdirSync } from "node:fs";
import { join } from "node:path";

function expandBraces(glob: string): string[] {
  const open = glob.indexOf("{");
  if (open === -1) return [glob];
  let depth = 0;
  for (let i = open; i < glob.length; i++) {
    if (glob[i] === "{") depth++;
    else if (glob[i] === "}" && --depth === 0) {
      const options: string[] = [];
      let start = open + 1;
      let level = 0;
      for (let j = open + 1; j < i; j++) {
        if (glob[j] === "{") level++;
        else if (glob[j] === "}") level--;
        else if (glob[j] === "," && level === 0) {
          options.push(glob.slice(start, j));
          start = j + 1;
        }
      }
      options.push(glob.slice(start, i));
      return options.flatMap((o) => expandBraces(glob.slice(0, open) + o + glob.slice(i + 1)));
    }
  }
  return [glob];
}

function segmentPattern(glob: string): string {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] as string;
    if (c === "*" && glob[i + 1] === "*") {
      const atStart = i === 0 || glob[i - 1] === "/";
      const next = glob[i + 2];
      if (atStart && next === "/") {
        out += "(?:.*/)?"; // `**/` also matches zero folders
        i += 2;
      } else if (atStart && next === undefined) {
        out += ".*";
        i += 1;
      } else {
        out += "[^/]*";
        i += 1;
      }
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return out;
}

/** Converts a glob (`**`, `*`, `?`, `{a,b}`) for forward-slash paths into an anchored RegExp. */
export function globToRegExp(glob: string): RegExp {
  return new RegExp(`^(?:${expandBraces(glob).map(segmentPattern).join("|")})$`);
}

export function matchesAny(path: string, globs: string[]): boolean {
  return globs.some((g) => globToRegExp(g).test(path));
}

const SKIP = new Set(["node_modules"]);

/** Every file below `root` as a sorted forward-slash path, skipping node_modules and dot folders and files. */
export function walkFiles(root: string): string[] {
  const out: string[] = [];
  const visit = (rel: string) => {
    for (const d of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (d.name.startsWith(".") || SKIP.has(d.name)) continue;
      const path = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) visit(path);
      else if (d.isFile()) out.push(path);
    }
  };
  visit("");
  return out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
