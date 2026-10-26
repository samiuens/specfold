// Every command module registers itself on import; the entry point and the tests load this one list.
import "./agents/command.ts";
import "./audit/command.ts";
import "./change/command.ts";
import "./doctor/command.ts";
import "./gate/command.ts";
import "./hooks/command.ts";
import "./indexes/command.ts";
import "./log/command.ts";
import "./lookup/command.ts";
import "./new/command.ts";
import "./sync/command.ts";
import "./tasks/command.ts";
import "./tasks/progress-command.ts";
import "./trace/command.ts";
import "./validate/index.ts";
import "./verify/command.ts";
