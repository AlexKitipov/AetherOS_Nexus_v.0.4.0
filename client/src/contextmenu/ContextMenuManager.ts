import { eventBus, type EventMap, type WindowContextTarget } from "@/core/eventBus";
import {
  requestKernelAppLaunch,
  requestKernelFileDelete,
  requestKernelFileProperties,
} from "@/kernel/integrationHooks";
import type { WindowManager } from "@/windowManager/WindowManager";

export interface ContextMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuManagerOptions {
  root: HTMLElement;
  windowManager: WindowManager;
  onRefreshDesktop?: () => void;
}

export class ContextMenuManager {
  private items: ContextMenuItem[] = [];
  private isOpen = false;
  private selectedIndex = -1;

  constructor(private readonly options: ContextMenuManagerOptions) {
    this.bindEventBus();
    this.bindGlobalInteractions();
  }

  open(items: ContextMenuItem[], position: { x: number; y: number }): void {
    this.items = items;
    this.selectedIndex = this.getFirstEnabledIndex();
    this.render();

    this.options.root.hidden = false;
    this.options.root.dataset.open = "true";
    this.options.root.style.display = "block";
    this.isOpen = true;

    this.positionWithinViewport(position);
    this.highlightSelected();
  }

  close(): void {
    this.items = [];
    this.selectedIndex = -1;
    this.isOpen = false;
    this.options.root.hidden = true;
    this.options.root.dataset.open = "false";
    this.options.root.style.display = "none";
    this.options.root.replaceChildren();
  }

  render(): void {
    const menu = document.createElement("div");
    menu.className = "global-context-menu";
    menu.tabIndex = -1;

    this.items.forEach((item, index) => {
      if (item.separator) {
        const separator = document.createElement("div");
        separator.className = "context-menu-separator";
        separator.setAttribute("role", "separator");
        menu.append(separator);
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "context-menu-item";
      button.dataset.index = String(index);
      button.disabled = Boolean(item.disabled);

      if (item.icon) {
        const icon = document.createElement("span");
        icon.className = "context-menu-icon";
        icon.textContent = item.icon;
        button.append(icon);
      }

      const label = document.createElement("span");
      label.className = "context-menu-label";
      label.textContent = item.label ?? "";
      button.append(label);

      button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (item.disabled) {
          return;
        }

        item.action?.();
        this.close();
      });

      menu.append(button);
    });

    this.options.root.replaceChildren(menu);
  }

  private bindEventBus(): void {
    eventBus.subscribe("contextmenu.desktop", ({ position }) => {
      this.open(
        [
          { id: "new-file", label: "New File", action: () => this.options.onRefreshDesktop?.() },
          { id: "new-folder", label: "New Folder", action: () => this.options.onRefreshDesktop?.() },
          { id: "paste", label: "Paste", disabled: true },
          { separator: true },
          { id: "refresh", label: "Refresh", action: () => this.options.onRefreshDesktop?.() },
          { id: "display-settings", label: "Display Settings", disabled: true },
        ],
        position,
      );
    });

    eventBus.subscribe("contextmenu.file", ({ position, target }) => {
      const extension = target.extension ?? "";

      const items: ContextMenuItem[] = [
        {
          id: "open",
          label: "Open",
          action: () => {
            if (target.type === "app" && target.appId) {
              void requestKernelAppLaunch(target.appId);
            }
          },
        },
        { id: "open-with", label: "Open With...", disabled: extension === ".app" },
        { separator: true },
        { id: "rename", label: "Rename", disabled: target.permissions?.canRename === false },
        {
          id: "delete",
          label: "Delete",
          disabled: target.permissions?.canDelete === false,
          action: () => {
            void requestKernelFileDelete(target.path);
            this.options.onRefreshDesktop?.();
          },
        },
        { id: "copy", label: "Copy" },
        { id: "cut", label: "Cut" },
        { separator: true },
        {
          id: "properties",
          label: "Properties",
          action: () => {
            void requestKernelFileProperties(target.path);
          },
        },
      ];

      this.open(items, position);
    });

    eventBus.subscribe("contextmenu.folder", ({ position, target }) => {
      const items: ContextMenuItem[] = [
        { id: "open", label: "Open" },
        { separator: true },
        { id: "new-file", label: "New File", disabled: target.permissions?.canCreate === false },
        { id: "new-folder", label: "New Folder", disabled: target.permissions?.canCreate === false },
        { separator: true },
        { id: "rename", label: "Rename", disabled: target.permissions?.canRename === false },
        { id: "delete", label: "Delete", disabled: target.permissions?.canDelete === false },
        {
          id: "properties",
          label: "Properties",
          action: () => {
            void requestKernelFileProperties(target.path);
          },
        },
      ];

      this.open(items, position);
    });

    eventBus.subscribe("contextmenu.taskbar", ({ position, target }) => {
      const windowRef = this.options.windowManager.getWindow(target.id);
      const isStart = target.isStartButton;

      const items: ContextMenuItem[] = [
        {
          id: "restore",
          label: "Restore",
          disabled: isStart || !windowRef || windowRef.state !== "minimized",
          action: () => this.options.windowManager.focusWindow(target.id),
        },
        {
          id: "minimize",
          label: "Minimize",
          disabled: isStart || !windowRef || windowRef.state === "minimized",
          action: () => this.options.windowManager.minimizeWindow(target.id),
        },
        {
          id: "close",
          label: "Close",
          disabled: isStart || !windowRef,
          action: () => this.options.windowManager.closeWindow(target.id),
        },
      ];

      this.open(items, position);
    });

    eventBus.subscribe("contextmenu.window", ({ position, target }) => {
      this.open(this.buildWindowItems(target), position);
    });
  }

  private buildWindowItems(target: WindowContextTarget): ContextMenuItem[] {
    return [
      {
        id: "minimize",
        label: "Minimize",
        disabled: target.state === "minimized",
        action: () => this.options.windowManager.minimizeWindow(target.id),
      },
      {
        id: "maximize",
        label: "Maximize",
        action: () => this.options.windowManager.maximizeWindow(target.id),
      },
      {
        id: "close",
        label: "Close",
        action: () => this.options.windowManager.closeWindow(target.id),
      },
      { separator: true },
      { id: "move", label: "Move", disabled: true },
      { id: "resize", label: "Resize", disabled: true },
    ];
  }

  private bindGlobalInteractions(): void {
    this.close();

    document.addEventListener("click", (event) => {
      if (!this.isOpen) {
        return;
      }

      if (!this.options.root.contains(event.target as Node)) {
        this.close();
      }
    });

    document.addEventListener("contextmenu", (event) => {
      if (!this.isOpen) {
        return;
      }

      if (!this.options.root.contains(event.target as Node)) {
        this.close();
      }
    });

    window.addEventListener(
      "wheel",
      () => {
        if (this.isOpen) {
          this.close();
        }
      },
      { passive: true },
    );

    window.addEventListener("blur", () => {
      if (this.isOpen) {
        this.close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!this.isOpen) {
        return;
      }

      if (event.key === "Escape") {
        this.close();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.moveSelection(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.moveSelection(-1);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = this.items[this.selectedIndex];
        selected?.action?.();
        this.close();
      }
    });
  }

  private positionWithinViewport(position: { x: number; y: number }): void {
    const menu = this.options.root.firstElementChild as HTMLElement | null;

    if (!menu) {
      this.options.root.style.left = `${position.x}px`;
      this.options.root.style.top = `${position.y}px`;
      return;
    }

    let x = position.x;
    let y = position.y;

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + menuWidth > viewportWidth) {
      x = Math.max(0, viewportWidth - menuWidth);
    }

    if (y + menuHeight > viewportHeight) {
      y = Math.max(0, viewportHeight - menuHeight);
    }

    this.options.root.style.left = `${Math.max(0, x)}px`;
    this.options.root.style.top = `${Math.max(0, y)}px`;
  }

  private moveSelection(direction: 1 | -1): void {
    if (this.items.length === 0) {
      return;
    }

    let nextIndex = this.selectedIndex;

    for (let step = 0; step < this.items.length; step += 1) {
      nextIndex = (nextIndex + direction + this.items.length) % this.items.length;
      const candidate = this.items[nextIndex];

      if (!candidate.separator && !candidate.disabled) {
        this.selectedIndex = nextIndex;
        this.highlightSelected();
        return;
      }
    }
  }

  private highlightSelected(): void {
    this.options.root.querySelectorAll<HTMLElement>(".context-menu-item").forEach((element) => {
      const index = Number(element.dataset.index);
      element.dataset.selected = String(index === this.selectedIndex);
    });
  }

  private getFirstEnabledIndex(): number {
    return this.items.findIndex((item) => !item.separator && !item.disabled);
  }
}

export type ContextMenuEventName =
  | "contextmenu.desktop"
  | "contextmenu.file"
  | "contextmenu.folder"
  | "contextmenu.window"
  | "contextmenu.taskbar";

export type ContextMenuPayload<TKey extends ContextMenuEventName> = EventMap[TKey];
