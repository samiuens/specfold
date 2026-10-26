#!/usr/bin/env node
// SKILL.md check for the kit repo only; never shipped.
// The rules are the common core of Claude Code, opencode and the skills CLI:
// see knowledge: /references/opencode.md
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DESCRIPTION = 1024;
const LINK = /\]\(\s*<?([^)\s>]+)>?\s*\)/g;

function checkSkill(dir) {
  const name = dir.split("/").at(-1);
  const file = join(dir, "SKILL.md");
  if (!existsSync(file)) return [`${dir}: no SKILL.md`];
  const text = readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return [`${file}: no frontmatter`];
  let data;
  try {
    data = parse(match[1]) ?? {};
  } catch (error) {
    return [`${file}: frontmatter is not valid YAML: ${error.message.split("\n")[0]}`];
  }
  const problems = [];
  if (data.name !== name) problems.push(`${file}: name '${data.name}' must equal the folder name '${name}'`);
  if (!NAME.test(name)) problems.push(`${file}: folder name '${name}' must be lowercase kebab-case`);
  const description = typeof data.description === "string" ? data.description.trim() : "";
  if (description.length === 0 || description.length > MAX_DESCRIPTION)
    problems.push(`${file}: description must have 1-${MAX_DESCRIPTION} characters (has ${description.length})`);
  for (const f of walk(dir).filter((p) => p.endsWith(".md"))) {
    for (const m of readFileSync(f, "utf8").matchAll(LINK)) {
      const target = m[1].split("#")[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/")) continue;
      if (!existsSync(resolve(dirname(f), target))) problems.push(`${f}: broken link '${m[1]}'`);
    }
  }
  return problems;
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("usage: node scripts/check-skills.mjs <skills-dir>...");
  process.exit(2);
}
const problems = [];
let count = 0;
for (const root of roots) {
  for (const entry of readdirSync(root).sort()) {
    const dir = join(root, entry);
    if (entry.startsWith(".") || !statSync(dir).isDirectory()) continue;
    count++;
    problems.push(...checkSkill(dir));
  }
}
for (const p of problems) console.error(p);
console.log(`${count} skills checked: ${problems.length} problems`);
process.exit(problems.length === 0 ? 0 : 1);
