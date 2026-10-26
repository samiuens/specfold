#!/usr/bin/env node
// Commit convention check for the kit repo only; never shipped.
// see knowledge: /decisions/commit-convention.md
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gitmojis } from "gitmojis";

const config = JSON.parse(readFileSync(new URL("./commit-convention.json", import.meta.url), "utf8"));
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const graphemes = (text) => [...segmenter.segment(text)].map((s) => s.segment);
// gitmoji.dev lists some emoji with U+FE0F, people often type them without it
const bare = (emoji) => emoji.replace(/️/g, "");
const byEmoji = new Map(gitmojis.map((g) => [bare(g.emoji), g]));
const byCode = new Map(gitmojis.map((g) => [g.code, g]));
const show = (code) => `${byCode.get(code)?.emoji ?? "?"} ${code}`;

function checkSubject(subject) {
  const errors = [];
  const match = /^([a-z]+)(?:\(([^)]*)\))?(!)?: (.*)$/u.exec(subject);
  if (!match) return ["subject must look like `<type>(<scope>): <gitmoji> <subject>`"];
  const [, type, scope, bang, rest] = match;
  const rule = config.types[type];
  if (!rule) errors.push(`unknown type \`${type}\`; allowed: ${Object.keys(config.types).join(", ")}`);
  if (scope !== undefined && !config.scopes.includes(scope)) {
    errors.push(`unknown scope \`${scope}\`; allowed: ${config.scopes.join(", ")} (extend scripts/commit-convention.json)`);
  }

  const [emoji = "", space = "", ...textParts] = graphemes(rest);
  const text = textParts.join("");
  const gitmoji = byEmoji.get(bare(emoji));
  if (space !== " " || !text.trim() || text !== text.trim()) {
    errors.push("put exactly one space between the gitmoji and a non-empty subject");
  }
  if (!gitmoji) {
    errors.push(`\`${emoji}\` is not an official gitmoji (gitmojis package)`);
  } else if (config.forbidden[gitmoji.code]) {
    errors.push(`${show(gitmoji.code)} is not allowed: ${config.forbidden[gitmoji.code]}`);
  } else if (bang) {
    if (gitmoji.code !== config.breaking) errors.push(`breaking changes (\`!\`) use ${show(config.breaking)}`);
  } else if (gitmoji.code === config.breaking) {
    errors.push(`${show(config.breaking)} marks a breaking change; add \`!\` after the type or scope`);
  } else if (rule && rule.default !== gitmoji.code && !rule.allowed.includes(gitmoji.code)) {
    const mapped = Object.values(config.types).some((t) => t.default === gitmoji.code || t.allowed.includes(gitmoji.code));
    errors.push(mapped
      ? `${show(gitmoji.code)} is not allowed for \`${type}\`; use ${[rule.default, ...rule.allowed].filter((c) => byCode.has(c)).map(show).join(", ")}`
      : `${show(gitmoji.code)} is not mapped to any type yet; extend scripts/commit-convention.json in a PR`);
  }

  if (/\.$/.test(text)) errors.push("no trailing period");
  const prose = text.replace(/`[^`]*`/g, "");
  if (prose !== prose.toLowerCase()) errors.push("write the subject in lowercase; wrap mixed-case identifiers in backticks");
  const length = graphemes(subject).length;
  if (length > config.maxLength) errors.push(`subject has ${length} characters; the limit is ${config.maxLength}`);
  return errors;
}

function checkMessage(message) {
  const lines = [];
  for (const line of message.split("\n")) {
    if (/^# -+ >8 -+$/.test(line)) break; // git's scissors line (commit -v)
    if (!line.startsWith("#")) lines.push(line.trimEnd());
  }
  while (lines.length && !lines.at(-1)) lines.pop();
  const [subject = "", ...rest] = lines;
  const errors = checkSubject(subject);
  if (rest.length && rest[0] !== "") errors.push("separate trailers from the subject with one blank line");
  for (const line of rest.slice(1)) {
    const trailer = /^([A-Za-z-]+): (.+)$/.exec(line);
    const key = trailer && Object.keys(config.trailers).find((k) => k.toLowerCase() === trailer[1].toLowerCase());
    if (!key) {
      errors.push(`no body allowed; only trailers ${Object.keys(config.trailers).join(", ")} (found \`${line}\`)`);
    } else if (!new RegExp(config.trailers[key]).test(trailer[2])) {
      errors.push(`malformed \`${key}\` trailer: \`${trailer[2]}\``);
    }
  }
  return errors;
}

function checkAuthor(name, email) {
  const agent = config.nonHumanAuthors.some((p) => [name, email].some((v) => new RegExp(p, "i").test(v)));
  return agent ? [`author \`${name} <${email}>\` is not a human identity; commit as yourself and add the agent as Co-Authored-By`] : [];
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

function selfCheck() {
  const mapped = new Set([...Object.keys(config.forbidden), config.breaking, ...Object.values(config.types).flatMap((t) => [t.default, ...t.allowed])]);
  return gitmojis.filter((g) => !mapped.has(g.code)).map((g) => `official gitmoji ${g.emoji} ${g.code} has no type; add it to scripts/commit-convention.json`);
}

function report(label, errors) {
  for (const e of errors) console.log(`${label}: ${e}`);
  return errors.length;
}

const [mode, value] = process.argv.slice(2);
let failures = 0;
if (mode === "--message-file" && value) {
  const [, name, email] = /^(.*) <(.*)> \d+ [+-]\d{4}$/.exec(git("var", "GIT_AUTHOR_IDENT").trim()) ?? [];
  failures += report("commit message", [...checkMessage(readFileSync(value, "utf8")), ...checkAuthor(name ?? "", email ?? "")]);
} else if (mode === "--range" && value) {
  for (const sha of git("rev-list", "--reverse", value).split("\n").filter(Boolean)) {
    const [name, email] = git("log", "-1", "--format=%an%n%ae", sha).trim().split("\n");
    failures += report(sha.slice(0, 7), [...checkMessage(git("log", "-1", "--format=%B", sha)), ...checkAuthor(name, email)]);
  }
} else if (mode === "--title" && value !== undefined) {
  failures += report("pr title", checkSubject(value));
} else if (mode === "--self-check") {
  failures += report("mapping", selfCheck());
} else {
  console.error("usage: check-commit.mjs --message-file <file> | --range <base>..<head> | --title <text> | --self-check");
  process.exit(2);
}
process.exit(failures ? 1 : 0);
