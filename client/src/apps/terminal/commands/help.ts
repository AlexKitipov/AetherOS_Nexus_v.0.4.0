import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_help(terminal: Terminal): void {
  terminal.print("Built-in commands:");
  terminal.print("ls cd mkdir touch rm cat clear help echo date ps kill open");
}
