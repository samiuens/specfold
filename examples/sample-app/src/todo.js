/** A to-do list kept in memory. */
export function createTodoList() {
  const items = [];
  let nextId = 1;

  return {
    /** Adds an open item and returns it. */
    add(title) {
      if (typeof title !== "string" || title.trim() === "") throw new TypeError("title must be a non-empty string");
      const item = { id: nextId++, title: title.trim(), done: false };
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
  };
}
