import type { Terminal } from "@/apps/terminal/Terminal";
import { getAppRuntime } from "@/core/shellServices";

export function cmd_kill(terminal: Terminal, args: string[]): void {
  const pidRaw = args[0];

  if (!pidRaw) {
    throw new Error("kill requires a pid.");
  }

  const pid = Number.parseInt(pidRaw, 10);

  if (Number.isNaN(pid)) {
    throw new Error("pid must be a number.");
  }

  const runtime = getAppRuntime();

  if (!runtime) {
    throw new Error("process manager unavailable");
  }

  runtime.terminateProcess(pid);
  terminal.print(`Sent terminate signal to ${pid}.`);
}
