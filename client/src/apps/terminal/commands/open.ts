import type { Terminal } from "@/apps/terminal/Terminal";
import { getAppRuntime } from "@/core/shellServices";

export function cmd_open(terminal: Terminal, args: string[]): void {
  const appId = args[0];

  if (!appId) {
    throw new Error("open requires an app id.");
  }

  const runtime = getAppRuntime();

  if (!runtime) {
    throw new Error("process manager unavailable");
  }

  const process = runtime.launchApp(appId);

  if (!process) {
    throw new Error(`app '${appId}' was not found.`);
  }

  terminal.print(`Launched '${appId}' (pid ${process.pid}).`);
}
