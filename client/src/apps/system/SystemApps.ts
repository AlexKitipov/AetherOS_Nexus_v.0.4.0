import type { OSApp, AppSandbox } from "@/process/types";
import { createTerminalApp } from "@/apps/terminal/createTerminalApp";

function buildSystemAppContent(title: string, description: string): (sandbox: AppSandbox) => HTMLElement {
  return (sandbox) => {
    const root = document.createElement("section");
    const heading = document.createElement("h2");
    const info = document.createElement("p");
    const pid = document.createElement("p");

    heading.textContent = title;
    info.textContent = description;
    pid.textContent = `PID: ${sandbox.pid}`;

    root.append(heading, info, pid);

    return root;
  };
}

export const SystemApps: Record<string, OSApp> = {
  FileExplorer: {
    id: "file-explorer",
    name: "File Explorer",
    icon: "📁",
    entry: buildSystemAppContent("File Explorer", "Browse files and folders in the virtual filesystem."),
  },
  TerminalEmulator: createTerminalApp(),
  Settings: {
    id: "settings",
    name: "Settings",
    icon: "⚙️",
    entry: buildSystemAppContent("Settings", "Manage system preferences and UI defaults."),
  },
  TextEditor: {
    id: "text-editor",
    name: "Text Editor",
    icon: "📝",
    entry: buildSystemAppContent("Text Editor", "Create and edit plain text documents."),
  },
  ProcessManager: {
    id: "process-manager",
    name: "Process Manager",
    icon: "📊",
    entry: buildSystemAppContent("Process Manager", "Monitor simulated process lifecycle and state."),
  },
};
