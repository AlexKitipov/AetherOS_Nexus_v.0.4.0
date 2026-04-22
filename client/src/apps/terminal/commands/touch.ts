import type { Terminal } from "@/apps/terminal/Terminal";
import { getRequiredFS, resolveTargetPath } from "@/apps/terminal/commands/utils";

export function cmd_touch(terminal: Terminal, args: string[]): void {
  const { parent, name } = resolveTargetPath(terminal, args[0]);
  getRequiredFS().createFile(parent, name, "");
}
