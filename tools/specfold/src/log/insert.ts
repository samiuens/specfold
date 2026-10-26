const DATE_HEADING = /^## (\d{4}-\d{2}-\d{2})\s*$/;

/**
 * Inserts `entry` under `## <date>` in log text and returns the new text.
 * Without existing text, a new log with a `# Log` title is created.
 */
export function insertEntry(text: string | undefined, date: string, entry: string): string {
  if (text === undefined || text.trim() === "") return `# Log\n\n## ${date}\n\n${entry}\n`;
  const lines = text.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const headings = lines
    .map((line, index) => ({ index, date: DATE_HEADING.exec(line)?.[1] }))
    .filter((h): h is { index: number; date: string } => h.date !== undefined);

  const same = headings.find((h) => h.date === date);
  if (same) {
    const next = lines.findIndex((line, i) => i > same.index && line.startsWith("## "));
    let last = (next === -1 ? lines.length : next) - 1;
    while (last > same.index && lines[last]?.trim() === "") last--;
    // directly under the heading the entry needs a blank line first
    lines.splice(last + 1, 0, ...(last === same.index ? ["", entry] : [entry]));
  } else {
    const older = headings.find((h) => h.date < date);
    if (older) lines.splice(older.index, 0, `## ${date}`, "", entry, "");
    else lines.push("", `## ${date}`, "", entry);
  }
  return `${lines.join("\n")}\n`;
}
