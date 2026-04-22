import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_echo(terminal: Terminal, args: string[]): void {
  terminal.print(args.join(" "));
}
