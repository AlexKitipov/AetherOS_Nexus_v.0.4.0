import { eventBus } from "@/core/eventBus";

export interface TaskbarButton {
  id: string;
  element: HTMLElement;
  active: boolean;
}

type WindowVisualState = "normal" | "minimized" | "maximized" | "closed";

export class TaskbarManager {
  private readonly buttons = new Map<string, TaskbarButton>();
  private readonly windowStates = new Map<string, WindowVisualState>();
  private activeWindowId: string | null = null;

  private readonly taskbarAppList: HTMLElement;
  private readonly taskbarSystemArea: HTMLElement;

  constructor(private readonly taskbarRoot: HTMLElement) {
    this.taskbarAppList = ensureChild(taskbarRoot, "taskbar-app-list");
    this.taskbarSystemArea = ensureChild(taskbarRoot, "taskbar-system-area");

    ensureChild(this.taskbarSystemArea, "system-clock");
    ensureChild(this.taskbarSystemArea, "system-tray");

    this.registerStartButton();
    this.bindWindowEvents();
  }

  registerWindow(id: string, title: string, icon?: string): void {
    if (this.buttons.has(id)) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.windowId = id;
    button.dataset.active = "false";
    button.textContent = icon ? `${icon} ${title}` : title;

    button.addEventListener("click", () => this.onWindowButtonClick(id));

    this.taskbarAppList.append(button);
    this.buttons.set(id, { id, element: button, active: false });

    if (!this.windowStates.has(id)) {
      this.windowStates.set(id, "normal");
    }
  }

  unregisterWindow(id: string): void {
    const button = this.buttons.get(id);

    if (!button) {
      return;
    }

    button.element.remove();
    this.buttons.delete(id);
    this.windowStates.delete(id);

    if (this.activeWindowId === id) {
      this.activeWindowId = null;
    }
  }

  setActive(id: string): void {
    this.activeWindowId = id;

    this.buttons.forEach((button, buttonId) => {
      const isActive = buttonId === id;
      button.active = isActive;
      button.element.dataset.active = String(isActive);
    });
  }

  clearActive(): void {
    this.activeWindowId = null;

    this.buttons.forEach((button) => {
      button.active = false;
      button.element.dataset.active = "false";
    });
  }

  syncTaskbarStateWithKernel(): void {
    // Hook for future kernel state sync.
  }

  private registerStartButton(): void {
    const startButton = document.createElement("button");
    startButton.id = "start";
    startButton.type = "button";
    startButton.textContent = "Start";

    startButton.addEventListener("click", () => {
      this.clearActive();
      eventBus.emit("taskbar.button.click", { id: "start" });
      eventBus.emit("startmenu.toggle", {});
    });

    this.taskbarAppList.prepend(startButton);
    this.buttons.set("start", { id: "start", element: startButton, active: false });
  }

  private onWindowButtonClick(id: string): void {
    eventBus.emit("taskbar.button.click", { id });
  }

  private bindWindowEvents(): void {
    eventBus.subscribe("window.create", ({ id }) => {
      this.windowStates.set(id, "normal");
      this.registerWindow(id, id);
    });

    eventBus.subscribe("window.close", ({ id }) => {
      this.unregisterWindow(id);
    });

    eventBus.subscribe("window.focus", ({ id, state }) => {
      this.windowStates.set(id, state ?? "normal");
      this.setActive(id);
    });

    eventBus.subscribe("window.minimize", ({ id }) => {
      this.windowStates.set(id, "minimized");

      if (this.activeWindowId === id) {
        this.clearActive();
      }
    });
  }
}

function ensureChild(root: HTMLElement, id: string): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`#${id}`);

  if (existing) {
    return existing;
  }

  const element = document.createElement("div");
  element.id = id;
  root.append(element);

  return element;
}
