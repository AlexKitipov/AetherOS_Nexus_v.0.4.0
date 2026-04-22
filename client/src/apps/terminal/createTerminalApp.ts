import type { AppSandbox, OSApp } from "@/process/types";
import { Terminal } from "@/apps/terminal/Terminal";

export function createTerminalApp(): OSApp {
  return {
    id: "terminal-emulator",
    name: "Terminal Emulator",
    icon: "🖥️",
    entry: (sandbox: AppSandbox) => {
      const terminal = new Terminal({
        pid: sandbox.pid,
        windowId: sandbox.getProcessInfo().windowId,
        hostName: "AetherOS",
      });

      terminal.print("AetherOS Nexus Terminal v0.4.0");
      terminal.print("Type 'help' to list commands.");
      queueMicrotask(() => terminal.focus());

      return terminal.rootElement;
    },
  };
}
