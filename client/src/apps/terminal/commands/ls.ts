import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_ls(terminal: Terminal, args: string[]): void {
  const path = args[0] ?? ".";
  const entries = terminal.listDirectory(path);

  if (entries.length === 0) {
    terminal.print("(empty)");
    return;
  }

  terminal.print(entries.map((entry) => (entry.type === "folder" ? `${entry.name}/` : entry.name)).join("  "));
}
