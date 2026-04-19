import { WindowManager } from "@/windowManager/WindowManager";
import { VirtualFS, type VFSNode } from "@/filesystem/VirtualFS";

interface FileExplorerOptions {
  virtualFS?: VirtualFS;
  windowManager?: WindowManager;
  onOpenFile?: (path: string) => void;
  onContextMenu?: (target: "file" | "folder" | "empty", path: string, event: MouseEvent) => void;
}

const DEFAULT_FOLDER_ICON = "📁";
const DEFAULT_FILE_ICON = "📄";

export class FileExplorer {
  windowId = "";
  currentPath: string;
  history: string[];
  historyIndex: number;

  readonly rootElement: HTMLDivElement;

  private readonly sidebarElement: HTMLDivElement;
  private readonly contentElement: HTMLDivElement;
  private readonly pathBarElement: HTMLInputElement;

  private readonly virtualFS: VirtualFS;
  private readonly expandedFolders = new Set<string>();
  private selectedPath: string | null = null;

  private readonly onOpenFile?: (path: string) => void;
  private readonly onContextMenu?: (target: "file" | "folder" | "empty", path: string, event: MouseEvent) => void;

  constructor(startPath: string, options: FileExplorerOptions = {}) {
    this.currentPath = normalizePath(startPath);
    this.history = [this.currentPath];
    this.historyIndex = 0;

    this.virtualFS = options.virtualFS ?? new VirtualFS();
    this.onOpenFile = options.onOpenFile;
    this.onContextMenu = options.onContextMenu;

    this.rootElement = document.createElement("div");
    this.rootElement.className = "file-explorer";

    const toolbarElement = document.createElement("div");
    toolbarElement.className = "explorer-toolbar";

    const backButton = createToolbarButton("btn-back", "←", "Back", () => this.goBack());
    const forwardButton = createToolbarButton("btn-forward", "→", "Forward", () => this.goForward());
    const upButton = createToolbarButton("btn-up", "↑", "Up", () => this.goUp());

    this.pathBarElement = document.createElement("input");
    this.pathBarElement.className = "path-bar";
    this.pathBarElement.type = "text";
    this.pathBarElement.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      const targetPath = normalizePath(this.pathBarElement.value);

      try {
        this.navigateTo(targetPath);
      } catch {
        this.updatePathBar();
      }
    });

    toolbarElement.append(backButton, forwardButton, upButton, this.pathBarElement);

    const body = document.createElement("div");
    body.className = "explorer-body";

    this.sidebarElement = document.createElement("div");
    this.sidebarElement.className = "explorer-sidebar";

    this.contentElement = document.createElement("div");
    this.contentElement.className = "explorer-content";
    this.contentElement.addEventListener("contextmenu", (event) => {
      if (event.target !== this.contentElement) {
        return;
      }

      event.preventDefault();
      this.onContextMenu?.("empty", this.currentPath, event);
    });

    body.append(this.sidebarElement, this.contentElement);
    this.rootElement.append(toolbarElement, body);

    this.expandedFolders.add("/");
    this.navigateTo(this.currentPath, { pushHistory: false });
  }

  navigateTo(path: string, options: { pushHistory?: boolean } = {}): void {
    const normalizedPath = normalizePath(path);
    const node = this.resolveNode(normalizedPath);

    if (!node || node.type !== "folder") {
      throw new Error(`Folder '${normalizedPath}' was not found.`);
    }

    this.currentPath = normalizedPath;

    if (options.pushHistory ?? true) {
      this.history = this.history.slice(0, this.historyIndex + 1);

      if (this.history[this.history.length - 1] !== normalizedPath) {
        this.history.push(normalizedPath);
      }

      this.historyIndex = this.history.length - 1;
    }

    expandParentFolders(this.currentPath, this.expandedFolders);
    this.updatePathBar();
    this.renderSidebar();
    this.renderContent();
  }

  goBack(): void {
    if (this.historyIndex <= 0) {
      return;
    }

    this.historyIndex -= 1;
    this.navigateTo(this.history[this.historyIndex], { pushHistory: false });
  }

  goForward(): void {
    if (this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex += 1;
    this.navigateTo(this.history[this.historyIndex], { pushHistory: false });
  }

  goUp(): void {
    if (this.currentPath === "/") {
      return;
    }

    const tokens = this.currentPath.split("/").filter(Boolean);
    tokens.pop();

    const parent = tokens.length === 0 ? "/" : `/${tokens.join("/")}`;
    this.navigateTo(parent);
  }

  renderSidebar(): void {
    this.sidebarElement.replaceChildren();
    this.sidebarElement.append(this.createFolderNode("/", "/"));
  }

  renderContent(): void {
    this.contentElement.replaceChildren();

    const entries = this.virtualFS
      .listFolder(this.currentPath)
      .sort((left, right) => Number(right.type === "folder") - Number(left.type === "folder") || left.name.localeCompare(right.name));

    entries.forEach((entry) => {
      const path = joinPath(this.currentPath, entry.name);
      const item = document.createElement("div");
      item.className = "file-item";
      item.dataset.path = path;

      const icon = document.createElement("img");
      icon.className = "file-icon";
      icon.alt = "";
      icon.src = entry.type === "folder" ? toEmojiIcon(DEFAULT_FOLDER_ICON) : toEmojiIcon(DEFAULT_FILE_ICON);

      const label = document.createElement("span");
      label.className = "file-label";
      label.textContent = entry.name;

      item.addEventListener("click", () => {
        this.selectedPath = path;
        this.highlightSelectedItem();
      });

      item.addEventListener("dblclick", () => {
        if (entry.type === "folder") {
          this.navigateTo(path);
          return;
        }

        this.onOpenFile?.(path);
      });

      item.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this.onContextMenu?.(entry.type, path, event);
      });

      item.append(icon, label);
      this.contentElement.append(item);
    });

    this.highlightSelectedItem();
  }

  updatePathBar(): void {
    this.pathBarElement.value = this.currentPath;
  }

  async loadDirectoryFromKernel(path: string): Promise<VFSNode[]> {
    return this.virtualFS.listFolder(path);
  }

  async saveChangesToKernel(): Promise<void> {
    return Promise.resolve();
  }

  async openFileThroughKernel(path: string): Promise<void> {
    this.onOpenFile?.(path);
    return Promise.resolve();
  }

  createFile(path: string, name: string): void {
    this.virtualFS.createFile(path, name);
    this.refreshAfterMutation(path);
  }

  createFolder(path: string, name: string): void {
    this.virtualFS.createFolder(path, name);
    this.refreshAfterMutation(path);
  }

  deleteNode(path: string): void {
    this.virtualFS.deleteNode(path);
    this.refreshAfterMutation(parentPath(path));
  }

  readFile(path: string): string | undefined {
    return this.virtualFS.readFile(path);
  }

  listFolder(path: string): VFSNode[] {
    return this.virtualFS.listFolder(path);
  }

  private createFolderNode(path: string, labelText: string): HTMLDivElement {
    const node = document.createElement("div");
    node.className = "folder-node";
    node.dataset.path = path;

    const label = document.createElement("span");
    label.className = "folder-label";
    label.textContent = labelText;

    const children = document.createElement("div");
    children.className = "folder-children";

    label.addEventListener("click", () => {
      if (this.expandedFolders.has(path)) {
        this.expandedFolders.delete(path);
      } else {
        this.expandedFolders.add(path);
      }

      this.navigateTo(path);
    });

    node.append(label, children);

    if (!this.expandedFolders.has(path)) {
      return node;
    }

    const folders = this.virtualFS.listFolder(path).filter((entry) => entry.type === "folder");

    folders.forEach((folder) => {
      const childPath = joinPath(path, folder.name);
      children.append(this.createFolderNode(childPath, folder.name));
    });

    return node;
  }

  private refreshAfterMutation(path: string): void {
    if (path === this.currentPath) {
      this.renderSidebar();
      this.renderContent();
    }
  }

  private highlightSelectedItem(): void {
    this.contentElement.querySelectorAll<HTMLElement>(".file-item").forEach((item) => {
      item.dataset.selected = String(item.dataset.path === this.selectedPath);
    });
  }

  private resolveNode(path: string): VFSNode | undefined {
    if (path === "/") {
      return this.virtualFS.root;
    }

    const tokens = path.split("/").filter(Boolean);
    let current: VFSNode | undefined = this.virtualFS.root;

    for (const token of tokens) {
      if (!current || current.type !== "folder") {
        return undefined;
      }

      current = (current.children ?? []).find((child) => child.name === token);
    }

    return current;
  }
}

export function launchFileExplorer(startPath: string, options: FileExplorerOptions = {}): FileExplorer {
  const windowManager = options.windowManager ?? WindowManager.getInstance();
  const explorer = new FileExplorer(startPath, options);

  const windowRef = windowManager.createWindow({
    title: "File Explorer",
    width: 900,
    height: 600,
    content: explorer.rootElement,
  });

  explorer.windowId = windowRef.id;
  return explorer;
}

function createToolbarButton(className: string, text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function normalizePath(path: string): string {
  const tokens = path.trim().split("/").filter(Boolean);
  return tokens.length === 0 ? "/" : `/${tokens.join("/")}`;
}

function joinPath(basePath: string, name: string): string {
  return normalizePath(`${basePath}/${name}`);
}

function parentPath(path: string): string {
  const tokens = normalizePath(path).split("/").filter(Boolean);

  if (tokens.length === 0) {
    return "/";
  }

  tokens.pop();
  return tokens.length === 0 ? "/" : `/${tokens.join("/")}`;
}

function expandParentFolders(path: string, expandedFolders: Set<string>): void {
  expandedFolders.add("/");

  let currentPath = "";
  normalizePath(path)
    .split("/")
    .filter(Boolean)
    .forEach((segment) => {
      currentPath = `${currentPath}/${segment}`;
      expandedFolders.add(currentPath);
    });
}

function toEmojiIcon(icon: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18'>${icon}</text></svg>`)}`;
}
