import type { Terminal } from "@/apps/terminal/Terminal";
import { getRequiredFS } from "@/apps/terminal/commands/utils";

export function cmd_rm(terminal: Terminal, args: string[]): void {
  const target = args[0];

  if (!target) {
    throw new Error("rm requires a path.");
  }

  getRequiredFS().deleteNode(terminal.resolvePath(target));
}
