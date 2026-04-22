import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_cd(terminal: Terminal, args: string[]): void {
  const path = args[0] ?? "~";
  const resolved = terminal.resolvePath(path);
  terminal.listDirectory(resolved);
  terminal.currentDirectory = resolved;
}
