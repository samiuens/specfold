// Builds the README diagrams in the brand's diagram style as light and dark SVGs.
// Run: node brand/diagrams/build.mjs. Style rules: brand/README.md, section Diagrams.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const THEMES = {
  light: { bg: "#F6F3EC", fg: "#1C1B19", on: "#F6F3EC", line: "#5E5A52", acc: "#C2410C", onAcc: "#FFFFFF" },
  dark: { bg: "#151412", fg: "#EDE8DC", on: "#151412", line: "#A39D90", acc: "#F08A5D", onAcc: "#1C1B19" },
};
const SANS = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Centered name plus up to two detail lines inside a box.
function labels(c, cx, top, h, name, subs, ink, soft) {
  const lines = 1 + subs.length;
  let y = top + h / 2 - (lines - 1) * 8 + 5;
  let out = `<text x="${cx}" y="${y}" text-anchor="middle" fill="${ink}" font-family="${SANS}" font-size="14" font-weight="600">${esc(name)}</text>`;
  for (const s of subs) {
    y += 17;
    out += `<text x="${cx}" y="${y}" text-anchor="middle" fill="${ink}" fill-opacity="${soft}" font-family="${MONO}" font-size="11">${esc(s)}</text>`;
  }
  return out;
}

// kind: "step" (solid ink), "store" (ink outline), "accent" (solid vermilion, one per diagram).
function box(c, { x, y, w, h = 56, name, subs = [], kind = "step" }) {
  if (kind === "store")
    return `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" fill="none" stroke="${c.fg}" stroke-width="2"/>` +
      labels(c, x + w / 2, y, h, name, subs, c.fg, ".75");
  const accent = kind === "accent";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${accent ? c.acc : c.fg}"/>` +
    labels(c, x + w / 2, y, h, name, subs, accent ? c.onAcc : c.on, accent ? "1" : ".75");
}

function diamond(c, { cx, cy, w = 104, h = 80, name }) {
  const pts = `${cx - w / 2},${cy} ${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2}`;
  return `<polygon points="${pts}" fill="${c.fg}"/>` +
    `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="${c.on}" font-family="${SANS}" font-size="13" font-weight="600">${esc(name)}</text>`;
}

// Straight, right-angled edge with an arrowhead at the end and an optional label.
function edge(c, d, label, at = {}) {
  let out = `<path d="${d}" fill="none" stroke="${c.line}" stroke-width="1.5" marker-end="url(#arrow)"/>`;
  if (label) out += `<text x="${at.x}" y="${at.y}" text-anchor="${at.anchor ?? "middle"}" fill="${c.line}" font-family="${MONO}" font-size="11">${esc(label)}</text>`;
  return out;
}
// A bare line without arrowhead, for spines that fan out or join.
const wire = (c, d) => `<path d="${d}" fill="none" stroke="${c.line}" stroke-width="1.5"/>`;

function svg(c, { w, h, title, desc, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c.line}"/></marker></defs>
<rect width="${w}" height="${h}" fill="${c.bg}"/>
<text x="24" y="36" fill="${c.fg}" font-family="${SANS}" font-size="15" font-weight="600">${esc(title)}</text>
${body(c).join("\n")}
</svg>
`;
}

const diagrams = {
  workflow: {
    w: 880, h: 330,
    title: "Knowledge flows into every change and comes back after archive",
    desc: "The planning interview looks up knowledge and asks every open decision. An approved brief becomes a proposal with spec deltas, design and tasks; a rejected one is recorded as a Decision. Apply runs one worktree per task group, check runs the tests and validation, archive merges the deltas into openspec/specs, and sync writes the knowledge delta back to knowledge/.",
    body: (c) => [
      edge(c, "M84 236V142", "lookup", { x: 92, y: 194, anchor: "start" }),
      edge(c, "M144 110H168"),
      edge(c, "M274 110H298", "yes", { x: 286, y: 102 }),
      edge(c, "M222 150V236", "no → Decision", { x: 230, y: 194, anchor: "start" }),
      edge(c, "M420 110H444"),
      edge(c, "M566 110H590"),
      edge(c, "M712 110H736"),
      edge(c, "M798 138V236", "merge deltas", { x: 790, y: 194, anchor: "end" }),
      edge(c, "M722 266H568", "after archive", { x: 652, y: 258 }),
      edge(c, "M446 266H286", "write back", { x: 366, y: 258 }),
      box(c, { x: 24, y: 82, w: 120, name: "1 Interview", subs: ["asks first"] }),
      diamond(c, { cx: 222, cy: 110, name: "Approved?" }),
      box(c, { x: 300, y: 82, w: 120, name: "2 Propose", subs: ["specs · tasks"] }),
      box(c, { x: 446, y: 82, w: 120, name: "3 Apply", subs: ["in worktrees"] }),
      box(c, { x: 592, y: 82, w: 120, name: "4 Check", subs: ["tests · validate"] }),
      box(c, { x: 738, y: 82, w: 120, name: "5 Archive", subs: ["change → specs"] }),
      box(c, { x: 24, y: 238, w: 260, h: 72, name: "knowledge/", subs: ["decisions · terms · runbooks", "trust: draft → verified"], kind: "accent" }),
      box(c, { x: 446, y: 238, w: 120, name: "6 Sync", subs: ["knowledge delta"] }),
      box(c, { x: 722, y: 238, w: 152, name: "openspec/specs/", subs: ["behavior contract"], kind: "store" }),
    ],
  },
  "parallel-apply": {
    w: 880, h: 380,
    title: "One implementer per task group, each in its own worktree",
    desc: "The orchestrator in the main session reads tasks.md and hands each task group its packet. Implementers work in parallel worktrees with one commit per task and are merged into the change branch per round. A task that needs a file outside its group comes back as a split proposal for the spec-writer and you. The verifier then runs tests, validation and the local gate: findings go back to their group, a pass leads to archive and sync.",
    body: (c) => [
      edge(c, "M120 178H142"),
      wire(c, "M264 178H280M280 114V242"),
      edge(c, "M280 114H298"),
      edge(c, "M280 178H298"),
      edge(c, "M280 242H298"),
      wire(c, "M428 114H448M428 178H448M428 242H448M448 114V242"),
      edge(c, "M448 178H470"),
      edge(c, "M592 178H610"),
      edge(c, "M724 178H746"),
      edge(c, "M800 218V290", "PASS", { x: 808, y: 258, anchor: "start" }),
      edge(c, "M800 138V64H364V86", "FINDINGS → its group", { x: 582, y: 58 }),
      edge(c, "M364 268V298", "SPLIT PROPOSAL", { x: 372, y: 288, anchor: "start" }),
      edge(c, "M300 326H200V206", "new group", { x: 208, y: 318, anchor: "start" }),
      box(c, { x: 24, y: 150, w: 96, name: "tasks.md", subs: ["groups"], kind: "store" }),
      box(c, { x: 144, y: 150, w: 120, name: "Orchestrator", subs: ["sends packets"] }),
      box(c, { x: 300, y: 88, w: 128, h: 52, name: "implementer 1", subs: ["worktree"] }),
      box(c, { x: 300, y: 152, w: 128, h: 52, name: "implementer 2", subs: ["worktree"] }),
      box(c, { x: 300, y: 216, w: 128, h: 52, name: "implementer 3", subs: ["worktree"] }),
      box(c, { x: 472, y: 150, w: 120, name: "Change branch", subs: ["merged per round"], kind: "store" }),
      box(c, { x: 612, y: 150, w: 112, name: "Verifier", subs: ["tests · gate"] }),
      diamond(c, { cx: 800, cy: 178, name: "Pass?" }),
      box(c, { x: 300, y: 300, w: 128, name: "spec-writer", subs: ["+ you decide"] }),
      box(c, { x: 740, y: 292, w: 120, name: "Archive · sync", subs: ["then the PR"], kind: "accent" }),
    ],
  },
  gate: {
    w: 880, h: 350,
    title: "One gate, the same rules on every machine",
    desc: "The pre-push hook, the agent stop hook (where the agent has one) and the specfold-gate CI check all run specfold gate on what the branch changes. It checks that source changes come with a change, that briefs are confirmed by a human, that knowledge validates, that scenarios are cited by tests, drift and token budgets. Blocking findings fail the check; otherwise the PR may merge. Warnings go to the job summary and one PR comment.",
    body: (c) => [
      wire(c, "M200 100H216M200 164H216M200 228H216M216 100V228"),
      edge(c, "M216 164H236"),
      edge(c, "M358 164H376"),
      edge(c, "M618 164H638"),
      edge(c, "M748 164H768", "no", { x: 758, y: 156 }),
      edge(c, "M694 204V266", "yes", { x: 702, y: 240, anchor: "start" }),
      edge(c, "M498 234V266", "warnings", { x: 506, y: 254, anchor: "start" }),
      box(c, { x: 24, y: 74, w: 176, h: 52, name: "pre-push hook" }),
      box(c, { x: 24, y: 138, w: 176, h: 52, name: "agent stop hook" }),
      box(c, { x: 24, y: 202, w: 176, h: 52, name: "CI: specfold-gate" }),
      box(c, { x: 238, y: 136, w: 120, name: "specfold gate", subs: ["branch diff"] }),
      `<rect x="379" y="95" width="238" height="138" fill="none" stroke="${c.fg}" stroke-width="2"/>`,
      `<text x="498" y="120" text-anchor="middle" fill="${c.fg}" font-family="${SANS}" font-size="14" font-weight="600">rules</text>`,
      ...["source change needs a change", "brief confirmed by a human", "concepts, links, indexes valid", "new scenarios cited by tests", "drift · token budgets"].map(
        (r, i) => `<text x="395" y="${144 + i * 18}" fill="${c.fg}" fill-opacity=".75" font-family="${MONO}" font-size="11">${esc(r)}</text>`,
      ),
      diamond(c, { cx: 694, cy: 164, w: 108, name: "Blocking?" }),
      box(c, { x: 770, y: 136, w: 96, name: "Merge", subs: ["allowed"], kind: "accent" }),
      box(c, { x: 634, y: 268, w: 120, name: "Check fails", subs: ["fix, push again"] }),
      box(c, { x: 418, y: 268, w: 160, name: "Job summary", subs: ["+ one PR comment"] }),
    ],
  },
};

for (const [name, d] of Object.entries(diagrams))
  for (const [mode, c] of Object.entries(THEMES))
    writeFileSync(join(here, `${name}-${mode}.svg`), svg(c, d));
console.log(`wrote ${Object.keys(diagrams).length * 2} diagrams`);
