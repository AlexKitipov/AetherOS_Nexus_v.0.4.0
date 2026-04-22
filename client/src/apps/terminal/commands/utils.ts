import { getVirtualFS } from "@/core/shellServices";
import type { Terminal } from "@/apps/terminal/Terminal";

export function getRequiredFS() {
  const virtualFS = getVirtualFS();

  if (!virtualFS) {
    throw new Error("Virtual filesystem is not available.");
  }

  return virtualFS;
}

export function resolveTargetPath(terminal: Terminal, input?: string): { parent: string; name: string } {
  const raw = input?.trim();

  if (!raw) {
    throw new Error("Missing path argument.");
  }

  const absolute = terminal.resolvePath(raw);
  const tokens = absolute.split("/").filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("Cannot target root path.");
  }

  const name = tokens[tokens.length - 1];
  const parent = `/${tokens.slice(0, -1).join("/")}` || "/";

  return { parent, name };
}
