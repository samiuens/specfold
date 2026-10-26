/** A wrong invocation: unknown command, flag or argument. Exit code 2. */
export class UsageError extends Error {}

/** The environment is not usable: missing or broken configuration, missing bundle. Exit code 2. */
export class EnvError extends Error {}
