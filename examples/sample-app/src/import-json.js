import { isCalendarDate } from "./todo.js";

/** Parses a JSON array of `{ title, done?, due? }` into checked entries; throws `TypeError` naming the bad index. */
export function fromJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new TypeError("import must be a JSON array");
  return data.map((entry, index) => {
    const fail = (message) => new TypeError(`entry ${index}: ${message}`);
    if (entry === null || typeof entry !== "object") throw fail("must be an object");
    const { title, done = false, due = null } = entry;
    if (typeof title !== "string" || title.trim() === "") throw fail("title must be a non-empty string");
    if (typeof done !== "boolean") throw fail("done must be true or false");
    if (due !== null && !isCalendarDate(due)) throw fail("due must be a YYYY-MM-DD date");
    return { title: title.trim(), done, due };
  });
}
