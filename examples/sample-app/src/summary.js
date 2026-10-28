/** Counts items: `{ total, open, done, withDue }`. */
export function summarize(items) {
  const done = items.filter((i) => i.done).length;
  return {
    total: items.length,
    open: items.length - done,
    done,
    withDue: items.filter((i) => i.due !== null && i.due !== undefined).length,
  };
}
