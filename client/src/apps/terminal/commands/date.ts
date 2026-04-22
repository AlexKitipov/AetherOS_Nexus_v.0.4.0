import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_date(terminal: Terminal): void {
  terminal.print(new Date().toString());
}
