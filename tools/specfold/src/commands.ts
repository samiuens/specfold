// Every command module registers itself on import; the entry point and the tests load this one list.
import "./doctor/command.ts";
import "./indexes/command.ts";
import "./log/command.ts";
import "./lookup/command.ts";
import "./new/command.ts";
import "./validate/index.ts";
import "./tasks/command.ts";
import "./tasks/progress-command.ts";
