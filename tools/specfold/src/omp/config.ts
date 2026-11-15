import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Document, isMap, parseDocument, type Node as YamlNode } from "yaml";
import { EnvError } from "../errors.ts";
import { yamlText } from "../yaml.ts";

/** omp's project settings: `bash.patterns` and the `task` keys Specfold owns. see knowledge: /references/omp.md */
export const OMP_CONFIG = ".omp/config.yml";

/** `.omp/config.yml` text as a YAML Document whose top level is a mapping; undefined (no file) is an empty one. */
export function parseOmpConfig(text: string | undefined): Document {
  const doc = parseDocument<YamlNode>(text ?? "");
  if (doc.errors[0]) throw new EnvError(`${OMP_CONFIG}: ${doc.errors[0].message.split("\n")[0]}`);
  if (doc.contents === null) doc.contents = doc.createNode({});
  else if (!isMap(doc.contents)) throw new EnvError(`${OMP_CONFIG} is not a YAML mapping`);
  return doc;
}

/** The repository's `.omp/config.yml` as a Document; a missing file reads as an empty mapping. */
export function readOmpConfig(root: string): Document {
  const path = join(root, OMP_CONFIG);
  return parseOmpConfig(existsSync(path) ? readFileSync(path, "utf8") : undefined);
}

/** The Document as file text, keeping comments and long lines. */
export const ompConfigText = (doc: Document): string => yamlText(doc);
