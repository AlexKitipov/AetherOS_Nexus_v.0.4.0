import { CommandParser } from "@/apps/terminal/CommandParser";
import { BUILTIN_COMMANDS, type TerminalCommand } from "@/apps/terminal/commands";
import { getVirtualFS } from "@/core/shellServices";
import type { VFSNode } from "@/filesystem/VirtualFS";
import type { KernelProcessInfo } from "@/process/types";

interface TerminalOptions {
  pid?: number;
  windowId?: string;
  hostName?: string;
}

export class Terminal {
  windowId: string;
  pid: number;
  history: string[];
  historyIndex: number;
  currentDirectory: string;
  environmentVariables: Map<string, string>;

  readonly rootElement: HTMLDivElement;

  private readonly outputElement: HTMLDivElement;
  private readonly inputElement: HTMLInputElement;
  private readonly promptElement: HTMLSpanElement;
  private readonly parser = new CommandParser();

  constructor(options: TerminalOptions = {}) {
    this.windowId = options.windowId ?? "";
    this.pid = options.pid ?? 0;
    this.history = [];
    this.historyIndex = 0;
    this.currentDirectory = "/home/guest";
    this.environmentVariables = new Map([
      ["USER", "guest"],
      ["HOME", "/home/guest"],
      ["PWD", "/home/guest"],
      ["OS_NAME", options.hostName ?? "YourOS"],
    ]);

    this.rootElement = document.createElement("div");
    this.rootElement.className = "terminal";

    this.outputElement = document.createElement("div");
    this.outputElement.className = "terminal-output";

    const inputLine = document.createElement("div");
    inputLine.className = "terminal-input-line";

    this.promptElement = document.createElement("span");
    this.promptElement.className = "terminal-prompt";

    this.inputElement = document.createElement("input");
    this.inputElement.className = "terminal-input";
    this.inputElement.type = "text";
    this.inputElement.autocomplete = "off";
    this.inputElement.spellcheck = false;

    inputLine.append(this.promptElement, this.inputElement);
    this.rootElement.append(this.outputElement, inputLine);

    this.attachKeyboardHandlers();
    this.renderPrompt();
  }

  print(text: string, tone: "normal" | "error" | "info" = "normal"): void {
    const line = document.createElement("div");
    line.className = "terminal-line";

    if (tone === "error") {
      line.classList.add("terminal-line-error");
    }

    if (tone === "info") {
      line.classList.add("terminal-line-info");
    }

    line.textContent = text;
    this.outputElement.append(line);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  execute(command: string): void {
    const normalized = command.trim();

    this.print(`${this.promptElement.textContent ?? ""} ${normalized}`.trim(), "info");

    if (!normalized) {
      this.renderPrompt();
      return;
    }

    this.history.push(normalized);
    this.historyIndex = this.history.length;

    const parsed = this.parser.parse(normalized);
    const handler = this.resolveCommand(parsed.name);

    if (!handler) {
      this.print(`Error: unknown command '${parsed.name}'. Type 'help' for command list.`, "error");
      this.renderPrompt();
      return;
    }

    try {
      handler(this, parsed.args);
    } catch (error) {
      this.print(`Error: ${(error as Error).message}`, "error");
    }

    this.renderPrompt();
  }

  renderPrompt(): void {
    this.environmentVariables.set("PWD", this.currentDirectory);
    const user = this.environmentVariables.get("USER") ?? "guest";
    const osName = this.environmentVariables.get("OS_NAME") ?? "YourOS";
    const home = this.environmentVariables.get("HOME") ?? "/home/guest";

    const location = this.currentDirectory.startsWith(home)
      ? this.currentDirectory.replace(home, "~") || "~"
      : this.currentDirectory;

    this.promptElement.textContent = `${user}@${osName}:${location}$`;
    this.inputElement.value = "";
  }

  clear(): void {
    this.outputElement.replaceChildren();
  }

  focus(): void {
    this.inputElement.focus();
  }

  resolvePath(path = "."): string {
    if (!path || path === ".") {
      return normalizePath(this.currentDirectory);
    }

    if (path === "~") {
      return normalizePath(this.environmentVariables.get("HOME") ?? "/");
    }

    if (path.startsWith("~/")) {
      const home = this.environmentVariables.get("HOME") ?? "/";
      return normalizePath(`${home}/${path.slice(2)}`);
    }

    if (path.startsWith("/")) {
      return normalizePath(path);
    }

    return normalizePath(`${this.currentDirectory}/${path}`);
  }

  listDirectory(path = "."): VFSNode[] {
    const virtualFS = getVirtualFS();

    if (!virtualFS) {
      throw new Error("Virtual filesystem is not available.");
    }

    return virtualFS.listFolder(this.resolvePath(path));
  }

  async sendCommandToKernel(command: string): Promise<string> {
    return Promise.resolve(`Kernel hook pending: ${command}`);
  }

  async requestKernelDirectory(path: string): Promise<VFSNode[]> {
    return Promise.resolve(this.listDirectory(path));
  }

  async requestKernelProcessList(): Promise<KernelProcessInfo[]> {
    const response = await this.sendCommandToKernel("ps");
    void response;
    return Promise.resolve([]);
  }

  private resolveCommand(name: string): TerminalCommand | undefined {
    return BUILTIN_COMMANDS[name];
  }

  private attachKeyboardHandlers(): void {
    this.rootElement.addEventListener("click", () => this.focus());

    this.inputElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.execute(this.inputElement.value);
        event.preventDefault();
        return;
      }

      if (event.key === "ArrowUp") {
        if (this.history.length === 0) {
          return;
        }

        this.historyIndex = Math.max(0, this.historyIndex - 1);
        this.inputElement.value = this.history[this.historyIndex] ?? "";
        event.preventDefault();
      }

      if (event.key === "ArrowDown") {
        if (this.history.length === 0) {
          return;
        }

        this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
        this.inputElement.value = this.history[this.historyIndex] ?? "";
        event.preventDefault();
      }
    });
  }
}

function normalizePath(path: string): string {
  const tokens = path.split("/").filter(Boolean);
  const stack: string[] = [];

  tokens.forEach((token) => {
    if (token === ".") {
      return;
    }

    if (token === "..") {
      stack.pop();
      return;
    }

    stack.push(token);
  });

  return `/${stack.join("/")}` || "/";
}
