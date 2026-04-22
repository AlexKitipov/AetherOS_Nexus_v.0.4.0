import type { Terminal } from "@/apps/terminal/Terminal";
import { getAppRuntime } from "@/core/shellServices";

export function cmd_ps(terminal: Terminal): void {
  const runtime = getAppRuntime();

  if (!runtime) {
    throw new Error("process manager unavailable");
  }

  const rows = runtime.listProcesses();

  if (rows.length === 0) {
    terminal.print("No running processes.");
    return;
  }

  terminal.print("PID\tAPP\tSTATE");
  rows.forEach((row) => terminal.print(`${row.pid}\t${row.appId}\t${row.state}`));
}
