import type { Terminal } from "@/apps/terminal/Terminal";

export function cmd_clear(terminal: Terminal): void {
  terminal.clear();
}
