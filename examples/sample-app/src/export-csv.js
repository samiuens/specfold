const HEADER = "id,title,done,due";

function field(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(items) {
  const rows = items.map((item) =>
    [item.id, item.title, item.done, item.due ?? ""].map(field).join(","),
  );
  return [HEADER, ...rows].join("\n");
}
