import type { Document } from "yaml";

/** A YAML document as text without folding long lines; the library folds at 80 characters by default. */
export const yamlText = (doc: Document) => doc.toString({ lineWidth: 0 });
