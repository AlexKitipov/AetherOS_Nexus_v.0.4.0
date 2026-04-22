import type { Terminal } from "@/apps/terminal/Terminal";
import { cmd_ls } from "@/apps/terminal/commands/ls";
import { cmd_cd } from "@/apps/terminal/commands/cd";
import { cmd_mkdir } from "@/apps/terminal/commands/mkdir";
import { cmd_touch } from "@/apps/terminal/commands/touch";
import { cmd_rm } from "@/apps/terminal/commands/rm";
import { cmd_cat } from "@/apps/terminal/commands/cat";
import { cmd_clear } from "@/apps/terminal/commands/clear";
import { cmd_help } from "@/apps/terminal/commands/help";
import { cmd_echo } from "@/apps/terminal/commands/echo";
import { cmd_date } from "@/apps/terminal/commands/date";
import { cmd_ps } from "@/apps/terminal/commands/ps";
import { cmd_kill } from "@/apps/terminal/commands/kill";
import { cmd_open } from "@/apps/terminal/commands/open";

export type TerminalCommand = (terminal: Terminal, args: string[]) => void;

export const BUILTIN_COMMANDS: Record<string, TerminalCommand> = {
  ls: cmd_ls,
  cd: cmd_cd,
  mkdir: cmd_mkdir,
  touch: cmd_touch,
  rm: cmd_rm,
  cat: cmd_cat,
  clear: cmd_clear,
  help: cmd_help,
  echo: cmd_echo,
  date: cmd_date,
  ps: cmd_ps,
  kill: cmd_kill,
  open: cmd_open,
};
