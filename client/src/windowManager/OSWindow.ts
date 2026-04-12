import type {
  WindowConfig,
  WindowPosition,
  WindowSize,
  WindowSnapshot,
  WindowState,
} from "@/windowManager/types";

const DEFAULT_MIN_WIDTH = 320;
const DEFAULT_MIN_HEIGHT = 220;

export class OSWindow {
  id: string;
  element: HTMLElement;
  state: WindowState;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  title: string;
  resizable: boolean;
  draggable: boolean;
  maintainAspectRatio: boolean;
  minWidth: number;
  minHeight: number;

  constructor(id: string, config: WindowConfig) {
    this.id = id;
    this.title = config.title;
    this.state = "normal";
    this.position = config.position ?? { x: 120, y: 80 };
    this.size = { width: config.width, height: config.height };
    this.zIndex = 100;
    this.resizable = config.resizable ?? true;
    this.draggable = config.draggable ?? true;
    this.maintainAspectRatio = config.maintainAspectRatio ?? false;
    this.minWidth = config.minWidth ?? DEFAULT_MIN_WIDTH;
    this.minHeight = config.minHeight ?? DEFAULT_MIN_HEIGHT;

    this.element = this.buildElement(config);
    this.applyGeometry();
    this.applyZIndex(this.zIndex);
  }

  private buildElement(config: WindowConfig): HTMLElement {
    const root = document.createElement("div");
    root.className = "os-window";
    root.dataset.id = this.id;

    const titlebar = document.createElement("div");
    titlebar.className = "window-titlebar";

    const title = document.createElement("span");
    title.className = "window-title";
    title.textContent = this.title;

    const controls = document.createElement("div");
    controls.className = "window-controls";

    const minimize = document.createElement("button");
    minimize.className = "btn-minimize";
    minimize.type = "button";

    const maximize = document.createElement("button");
    maximize.className = "btn-maximize";
    maximize.type = "button";

    const close = document.createElement("button");
    close.className = "btn-close";
    close.type = "button";

    controls.append(minimize, maximize, close);
    titlebar.append(title, controls);

    const content = document.createElement("div");
    content.className = "window-content";

    if (typeof config.content === "string") {
      content.innerHTML = config.content;
    } else if (config.content instanceof HTMLElement) {
      content.append(config.content);
    }

    root.append(titlebar, content);

    return root;
  }

  applyZIndex(zIndex: number): void {
    this.zIndex = zIndex;
    this.element.style.zIndex = `${zIndex}`;
  }

  setPosition(nextPosition: WindowPosition): void {
    this.position = nextPosition;
    this.element.style.left = `${nextPosition.x}px`;
    this.element.style.top = `${nextPosition.y}px`;
  }

  setSize(nextSize: WindowSize): void {
    this.size = nextSize;
    this.element.style.width = `${nextSize.width}px`;
    this.element.style.height = `${nextSize.height}px`;
  }

  setState(nextState: WindowState): void {
    this.state = nextState;
    this.element.dataset.state = nextState;

    if (nextState === "minimized") {
      this.element.hidden = true;
      return;
    }

    this.element.hidden = nextState === "closed";
  }

  applyGeometry(): void {
    this.element.style.position = "absolute";
    this.setPosition(this.position);
    this.setSize(this.size);
  }

  snapshot(): WindowSnapshot {
    return {
      id: this.id,
      position: { ...this.position },
      size: { ...this.size },
      state: this.state,
    };
  }
}
