import { type ParseArgsConfig, parseArgs } from "node:util";
import { EnvError, UsageError } from "./errors.ts";

declare const __SPECFOLD_VERSION__: string;

export interface Io {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Reads all of stdin; absent when the caller has none to offer. */
  readStdin?: () => Promise<string>;
}

export interface CommandContext {
  io: Io;
  values: Record<string, string | boolean | undefined>;
  positionals: string[];
}

export interface Command {
  name: string;
  summary: string;
  usage: string;
  options: NonNullable<ParseArgsConfig["options"]>;
  run: (ctx: CommandContext) => number | Promise<number>;
}

const commands = new Map<string, Command>();

export function register(command: Command): void {
  commands.set(command.name, command);
}

function help(): string {
  const lines = ["Usage: specfold <command> [options]", "", "Commands:"];
  for (const c of [...commands.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`  ${c.name.padEnd(12)}${c.summary}`);
  }
  lines.push("", "Options:", "  --help      show help", "  --version   show the version");
  return `${lines.join("\n")}\n`;
}

/** Runs the CLI and returns the exit code: 0 ok, 1 findings, 2 usage or environment error. */
export async function main(argv: string[], io: Io): Promise<number> {
  const [name, ...rest] = argv;
  try {
    if (name === undefined || name === "--help" || name === "-h") {
      io.stdout(help());
      return name === undefined ? 2 : 0;
    }
    if (name === "--version" || name === "-v") {
      io.stdout(`${__SPECFOLD_VERSION__}\n`);
      return 0;
    }
    const command = commands.get(name);
    if (!command) throw new UsageError(`unknown command '${name}'`);
    if (rest.includes("--help")) {
      io.stdout(`Usage: ${command.usage}\n`);
      return 0;
    }
    let parsed: ReturnType<typeof parseArgs>;
    try {
      parsed = parseArgs({ args: rest, options: command.options, allowPositionals: true, strict: true });
    } catch (error) {
      throw new UsageError((error as Error).message);
    }
    return await command.run({
      io,
      values: parsed.values as CommandContext["values"],
      positionals: parsed.positionals,
    });
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr(`specfold: ${error.message}\nRun 'specfold --help' for usage.\n`);
      return 2;
    }
    if (error instanceof EnvError) {
      io.stderr(`specfold: ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}
