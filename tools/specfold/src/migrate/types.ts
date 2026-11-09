/** The concept types the template's specfold.yaml lists; a test keeps both equal. */
export const SPECFOLD_TYPES = [
  "Term",
  "Business Rule",
  "Component",
  "Data Flow",
  "Interface",
  "Decision",
  "Capability",
  "Convention",
  "Runbook",
  "Reference",
  "Vision",
  "Deferred Commitment",
  "Backlog Item",
] as const;

/** Types of other bundles with a clear Specfold equivalent. */
export const TYPE_MAP: Readonly<Record<string, string>> = {
  ADR: "Decision",
  Playbook: "Runbook",
  "Domain Concept": "Term",
  App: "Component",
};

/** The Specfold type a migration suggests for `type`, or undefined when none is clear. */
export function suggestType(type: string, known: readonly string[] = SPECFOLD_TYPES): string | undefined {
  if (known.includes(type)) return type;
  return TYPE_MAP[type];
}
