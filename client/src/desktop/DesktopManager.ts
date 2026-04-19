import { getApp } from "@/apps/AppRegistry";
import type { WindowManager } from "@/windowManager/WindowManager";
import {
  attachDesktopIconDrag,
  DESKTOP_GRID_SIZE,
  findAvailableGridSlot,
  snapToGrid,
  type DragBounds,
} from "@/desktop/drag";
import { VirtualFS, type VFSNode, type VFSPosition } from "@/filesystem/VirtualFS";
import { launchFileExplorer } from "@/apps/fileExplorer/FileExplorer";

export interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  type: "app" | "file" | "folder";
  launch?: () => void;
  open?: () => void;
}

interface DesktopIconRecord {
  icon: DesktopIcon;
  element: HTMLDivElement;
  position: VFSPosition;
  fsPath?: string;
}

interface DesktopManagerOptions {
  desktopRoot: HTMLElement;
  virtualFS: VirtualFS;
  windowManager?: WindowManager;
  gridSize?: number;
  desktopPath?: string;
}

const DEFAULT_DESKTOP_PATH = "/desktop";

export class DesktopManager {
  private icons: DesktopIcon[] = [];
  private iconRecords = new Map<string, DesktopIconRecord>();
  private selectedIconIds = new Set<string>();
  private readonly dragTeardown = new Map<string, () => void>();
  private readonly gridSize: number;
  private readonly desktopPath: string;

  constructor(private readonly options: DesktopManagerOptions) {
    this.gridSize = options.gridSize ?? DESKTOP_GRID_SIZE;
    this.desktopPath = options.desktopPath ?? DEFAULT_DESKTOP_PATH;
  }

  loadIcons(icons: DesktopIcon[]): void {
    this.icons = [...icons];
    this.refresh();
  }

  loadDesktopFromFS(path = this.desktopPath): void {
    const entries = this.options.virtualFS.listFolder(path);

    const icons = entries.map((node) => this.mapVFSNodeToIcon(node, path));
    this.loadIcons(icons);
  }

  render(): void {
    this.disposeDragHandlers();
    this.iconRecords.clear();
    this.options.desktopRoot.replaceChildren();

    this.icons.forEach((icon, index) => {
      const element = this.createIconElement(icon);
      const fsPath = `${this.desktopPath}/${icon.name}`;
      const position = this.getInitialPosition(icon.id, index, fsPath);

      element.style.position = "absolute";
      element.style.left = `${position.x}px`;
      element.style.top = `${position.y}px`;

      this.options.desktopRoot.append(element);

      this.iconRecords.set(icon.id, { icon, element, position, fsPath });
      this.attachInteractions(icon.id);
    });

    this.attachSelectionBox();
  }

  refresh(): void {
    this.render();
  }

  handleClick(id: string): void {
    this.selectedIconIds.clear();
    this.selectedIconIds.add(id);
    this.updateSelectionStates();
  }

  handleDoubleClick(id: string): void {
    const record = this.iconRecords.get(id);

    if (!record) {
      return;
    }

    if (record.icon.type === "app") {
      record.icon.launch?.();
      return;
    }

    if (record.icon.type === "folder") {
      record.icon.open?.();
      return;
    }

    record.icon.open?.();
  }

  handleDrag(id: string, position: VFSPosition): void {
    const record = this.iconRecords.get(id);

    if (!record) {
      return;
    }

    const bounded = this.snapWithinDesktop(position);
    const resolved = findAvailableGridSlot(bounded, id, this.isGridPositionOccupied, this.getDesktopBounds(), this.gridSize);

    record.position = resolved;
    record.element.style.left = `${resolved.x}px`;
    record.element.style.top = `${resolved.y}px`;

    if (record.fsPath) {
      this.options.virtualFS.updateNode(record.fsPath, (node) => {
        node.metadata ??= {};
        node.metadata.iconPosition = resolved;
      });
    }
  }

  private createIconElement(icon: DesktopIcon): HTMLDivElement {
    const root = document.createElement("div");
    root.className = "desktop-icon";
    root.dataset.id = icon.id;

    const image = document.createElement("img");
    image.className = "desktop-icon-image";
    image.src = icon.icon;
    image.alt = `${icon.name} icon`;

    const label = document.createElement("span");
    label.className = "desktop-icon-label";
    label.textContent = icon.name;

    root.append(image, label);

    return root;
  }

  private mapVFSNodeToIcon(node: VFSNode, parentPath: string): DesktopIcon {
    if (node.type === "folder") {
      return {
        id: node.id,
        name: node.name,
        icon: String(node.metadata?.icon ?? ""),
        type: "folder",
        open: () => this.openFolderWindow(`${parentPath}/${node.name}`),
      };
    }

    const appDefinition = node.metadata?.appId ? getApp(String(node.metadata.appId)) : undefined;

    return {
      id: node.id,
      name: node.name,
      icon: String(node.metadata?.icon ?? ""),
      type: appDefinition ? "app" : "file",
      launch: appDefinition?.launch,
      open: () => this.openFileWithDefaultApp(`${parentPath}/${node.name}`),
    };
  }

  private openFolderWindow(path: string): void {
    const windowManager = this.options.windowManager;

    if (!windowManager) {
      return;
    }

    const existing = windowManager.getWindow(`explorer:${path}`);

    if (existing) {
      windowManager.focusWindow(existing.id);
      return;
    }

    launchFileExplorer(path, {
      windowManager,
      virtualFS: this.options.virtualFS,
      onOpenFile: (filePath) => this.openFileWithDefaultApp(filePath),
    });
  }

  private openFileWithDefaultApp(path: string): void {
    const content = this.options.virtualFS.readFile(path) ?? "";
    const windowManager = this.options.windowManager;

    if (!windowManager) {
      return;
    }

    const existing = windowManager.getWindow(`file:${path}`);

    if (existing) {
      windowManager.focusWindow(existing.id);
      return;
    }

    windowManager.createWindow({
      id: `file:${path}`,
      title: path,
      content: `<pre>${escapeHTML(content)}</pre>`,
      width: 520,
      height: 360,
      position: { x: 220, y: 130 },
    });
  }

  private getInitialPosition(iconId: string, index: number, fsPath: string): VFSPosition {
    const node = this.options.virtualFS.getNode(fsPath);
    const saved = node?.metadata?.iconPosition;

    if (saved) {
      return this.snapWithinDesktop(saved);
    }

    const bounds = this.getDesktopBounds();
    const defaultPosition = {
      x: 0,
      y: index * this.gridSize,
    };

    return findAvailableGridSlot(defaultPosition, iconId, this.isGridPositionOccupied, bounds, this.gridSize);
  }

  private attachInteractions(iconId: string): void {
    const record = this.iconRecords.get(iconId);

    if (!record) {
      return;
    }

    record.element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.handleClick(iconId);
    });

    record.element.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.handleDoubleClick(iconId);
    });

    record.element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openContextMenuForIcon(iconId, event.clientX, event.clientY);
    });

    const cleanup = attachDesktopIconDrag(record.element, iconId, {
      getBounds: this.getDesktopBounds,
      isOccupied: this.isGridPositionOccupied,
      onDrop: (id, position) => this.handleDrag(id, position),
    });

    this.dragTeardown.set(iconId, cleanup);
  }

  private attachSelectionBox(): void {
    this.options.desktopRoot.onpointerdown = (event) => {
      if (event.target !== this.options.desktopRoot) {
        return;
      }

      this.selectedIconIds.clear();
      this.updateSelectionStates();
    };
  }

  private openContextMenuForIcon(id: string, x: number, y: number): void {
    const record = this.iconRecords.get(id);

    if (!record) {
      return;
    }

    const contextMenu = document.getElementById("context-menu");

    if (!contextMenu) {
      return;
    }

    const options =
      record.icon.type === "app"
        ? ["Open", "Pin to taskbar", "Properties"]
        : record.icon.type === "folder"
          ? ["Open", "Rename", "Delete"]
          : ["Open", "Open With", "Delete"];

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.innerHTML = options.map((option) => `<button type="button">${option}</button>`).join("");
  }

  private updateSelectionStates(): void {
    this.iconRecords.forEach(({ element }, id) => {
      element.dataset.selected = String(this.selectedIconIds.has(id));
    });
  }

  private getDesktopBounds = (): DragBounds => ({
    width: this.options.desktopRoot.clientWidth,
    height: this.options.desktopRoot.clientHeight,
  });

  private snapWithinDesktop(position: VFSPosition): VFSPosition {
    const bounds = this.getDesktopBounds();
    const snapped = snapToGrid(position, this.gridSize);

    return {
      x: Math.max(0, Math.min(snapped.x, Math.max(0, bounds.width - this.gridSize))),
      y: Math.max(0, Math.min(snapped.y, Math.max(0, bounds.height - this.gridSize))),
    };
  }

  private isGridPositionOccupied = (position: VFSPosition, iconId: string): boolean => {
    const snapped = snapToGrid(position, this.gridSize);

    return Array.from(this.iconRecords.values()).some((record) => {
      if (record.icon.id === iconId) {
        return false;
      }

      const candidate = snapToGrid(record.position, this.gridSize);
      return candidate.x === snapped.x && candidate.y === snapped.y;
    });
  };

  private disposeDragHandlers(): void {
    this.dragTeardown.forEach((cleanup) => cleanup());
    this.dragTeardown.clear();
  }
}

function escapeHTML(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
