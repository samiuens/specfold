const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` string naming a real calendar day (rejects 2026-02-30). */
function isCalendarDate(value) {
  if (typeof value !== "string" || !CALENDAR_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** A to-do list kept in memory. */
export function createTodoList() {
  const items = [];
  let nextId = 1;

  return {
    /** Adds an open item, optionally with a `YYYY-MM-DD` due date, and returns it. */
    add(title, { due = null } = {}) {
      if (typeof title !== "string" || title.trim() === "") throw new TypeError("title must be a non-empty string");
      if (due !== null && !isCalendarDate(due)) throw new TypeError(`due must be a YYYY-MM-DD date, got ${due}`);
      const item = { id: nextId++, title: title.trim(), done: false, due };
      items.push(item);
      return { ...item };
    },

    /** Marks an item as done; unknown ids throw. */
    complete(id) {
      const item = items.find((i) => i.id === id);
      if (!item) throw new RangeError(`no item with id ${id}`);
      item.done = true;
      return { ...item };
    },

    /** All items in insertion order, optionally only open or only done ones. */
    list({ done } = {}) {
      return items.filter((i) => done === undefined || i.done === done).map((i) => ({ ...i }));
    },

    /** Open items due strictly before `today` (`YYYY-MM-DD`), in insertion order. */
    overdue(today) {
      if (!isCalendarDate(today)) throw new TypeError(`today must be a YYYY-MM-DD date, got ${today}`);
      return items.filter((i) => !i.done && i.due !== null && i.due < today).map((i) => ({ ...i }));
    },
  };
}
