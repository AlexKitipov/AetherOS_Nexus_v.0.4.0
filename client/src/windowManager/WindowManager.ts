import { eventBus } from "@/core/eventBus";
import { OSWindow } from "@/windowManager/OSWindow";
import { attachWindowDrag } from "@/windowManager/drag";
import { attachWindowResize } from "@/windowManager/resize";
import type { WindowConfig, WindowEventPayload, WindowSnapshot } from "@/windowManager/types";

const WINDOW_LAYER_ID = "window-layer";

export class WindowManager {
  private static instance: WindowManager | null = null;

  private windows = new Map<string, OSWindow>();
  private activeWindowId: string | null = null;
  private currentTopZ = 100;
  private lifecycleTeardown = new Map<string, Array<() => void>>();

  private constructor(private readonly windowLayer: HTMLElement) {}

  static getInstance(windowLayer?: HTMLElement): WindowManager {
    if (!WindowManager.instance) {
      const rootLayer = windowLayer ?? ensureWindowLayer();
      WindowManager.instance = new WindowManager(rootLayer);
    }

    return WindowManager.instance;
  }

  createWindow(config: WindowConfig): OSWindow {
    const id = config.id ?? crypto.randomUUID();

    if (this.windows.has(id)) {
      throw new Error(`Window with id '${id}' already exists.`);
    }

    const windowRef = new OSWindow(id, config);
    this.windowLayer.append(windowRef.element);
    this.windows.set(id, windowRef);

    this.registerWindowInteractions(windowRef);
    this.bindControlButtons(windowRef);
    this.bringToFront(id);
    this.focusWindow(id);

    this.emit("window.create", { id, state: windowRef.state, position: windowRef.position, size: windowRef.size });

    return windowRef;
  }

  closeWindow(id: string): void {
    const windowRef = this.windows.get(id);

    if (!windowRef) {
      return;
    }

    windowRef.setState("closed");
    windowRef.element.remove();

    this.lifecycleTeardown.get(id)?.forEach((cleanup) => cleanup());
    this.lifecycleTeardown.delete(id);
    this.windows.delete(id);

    if (this.activeWindowId === id) {
      this.activeWindowId = null;
    }

    this.emit("window.close", { id, state: "closed" });
  }

  focusWindow(id: string): void {
    const windowRef = this.windows.get(id);

    if (!windowRef || windowRef.state === "closed") {
      return;
    }

    if (windowRef.state === "minimized") {
      windowRef.setState("normal");
    }

    this.activeWindowId = id;
    this.bringToFront(id);
    this.emit("window.focus", { id, state: windowRef.state });
  }

  minimizeWindow(id: string): void {
    const windowRef = this.windows.get(id);

    if (!windowRef) {
      return;
    }

    windowRef.setState("minimized");

    if (this.activeWindowId === id) {
      this.activeWindowId = null;
    }

    this.emit("window.minimize", { id, state: windowRef.state });
  }

  maximizeWindow(id: string): void {
    const windowRef = this.windows.get(id);

    if (!windowRef) {
      return;
    }

    if (windowRef.state === "maximized") {
      windowRef.setState("normal");
      windowRef.applyGeometry();
    } else {
      windowRef.setState("maximized");
      windowRef.setPosition({ x: 0, y: 0 });
      windowRef.setSize({
        width: this.windowLayer.clientWidth,
        height: this.windowLayer.clientHeight,
      });
    }

    this.focusWindow(id);
    this.emit("window.maximize", { id, state: windowRef.state, size: windowRef.size });
  }

  bringToFront(id: string): void {
    const windowRef = this.windows.get(id);

    if (!windowRef || windowRef.state === "closed") {
      return;
    }

    this.currentTopZ += 1;
    windowRef.applyZIndex(this.currentTopZ);
  }

  saveWindowState(id: string): WindowSnapshot {
    const windowRef = this.windows.get(id);

    if (!windowRef) {
      throw new Error(`Window with id '${id}' not found.`);
    }

    return windowRef.snapshot();
  }

  restoreWindowState(snapshot: WindowSnapshot): void {
    const windowRef = this.windows.get(snapshot.id);

    if (!windowRef) {
      return;
    }

    windowRef.setPosition(snapshot.position);
    windowRef.setSize(snapshot.size);
    windowRef.setState(snapshot.state);

    if (snapshot.state !== "closed") {
      this.bringToFront(snapshot.id);
    }
  }

  getWindow(id: string): OSWindow | undefined {
    return this.windows.get(id);
  }

  private bindControlButtons(windowRef: OSWindow): void {
    const minimizeButton = windowRef.element.querySelector<HTMLButtonElement>(".btn-minimize");
    const maximizeButton = windowRef.element.querySelector<HTMLButtonElement>(".btn-maximize");
    const closeButton = windowRef.element.querySelector<HTMLButtonElement>(".btn-close");

    const onFocus = () => this.focusWindow(windowRef.id);
    const onMinimize = (event: Event) => {
      event.stopPropagation();
      this.minimizeWindow(windowRef.id);
    };
    const onMaximize = (event: Event) => {
      event.stopPropagation();
      this.maximizeWindow(windowRef.id);
    };
    const onClose = (event: Event) => {
      event.stopPropagation();
      this.closeWindow(windowRef.id);
    };

    windowRef.element.addEventListener("mousedown", onFocus);
    minimizeButton?.addEventListener("click", onMinimize);
    maximizeButton?.addEventListener("click", onMaximize);
    closeButton?.addEventListener("click", onClose);

    const existing = this.lifecycleTeardown.get(windowRef.id) ?? [];
    this.lifecycleTeardown.set(windowRef.id, [
      ...existing,
      () => windowRef.element.removeEventListener("mousedown", onFocus),
      () => minimizeButton?.removeEventListener("click", onMinimize),
      () => maximizeButton?.removeEventListener("click", onMaximize),
      () => closeButton?.removeEventListener("click", onClose),
    ]);
  }

  private registerWindowInteractions(windowRef: OSWindow): void {
    const dragCleanup = attachWindowDrag(windowRef, {
      getBounds: () => ({ width: this.windowLayer.clientWidth, height: this.windowLayer.clientHeight }),
      onMove: (movedWindow) => {
        this.emit("window.move", { id: movedWindow.id, position: movedWindow.position });
      },
    });

    const resizeCleanup = attachWindowResize(windowRef, {
      onResize: (resizedWindow) => {
        this.emit("window.resize", { id: resizedWindow.id, size: resizedWindow.size, position: resizedWindow.position });
      },
    });

    const existing = this.lifecycleTeardown.get(windowRef.id) ?? [];
    this.lifecycleTeardown.set(windowRef.id, [...existing, dragCleanup, resizeCleanup]);
  }

  private emit(eventName: keyof WindowEvents, payload: WindowEventPayload): void {
    eventBus.emit(eventName, payload as never);
  }
}

type WindowEvents = {
  "window.create": WindowEventPayload;
  "window.close": WindowEventPayload;
  "window.focus": WindowEventPayload;
  "window.minimize": WindowEventPayload;
  "window.maximize": WindowEventPayload;
  "window.move": WindowEventPayload;
  "window.resize": WindowEventPayload;
};

function ensureWindowLayer(): HTMLElement {
  const existing = document.getElementById(WINDOW_LAYER_ID);

  if (existing) {
    return existing;
  }

  const layer = document.createElement("div");
  layer.id = WINDOW_LAYER_ID;
  layer.style.position = "absolute";
  layer.style.inset = "0";
  document.body.append(layer);

  return layer;
}
