import type { Terminal } from "@/apps/terminal/Terminal";
import { getRequiredFS } from "@/apps/terminal/commands/utils";

export function cmd_cat(terminal: Terminal, args: string[]): void {
  const target = args[0];

  if (!target) {
    throw new Error("cat requires a file path.");
  }

  const content = getRequiredFS().readFile(terminal.resolvePath(target));

  if (typeof content !== "string") {
    throw new Error("file not found");
  }

  terminal.print(content);
}
