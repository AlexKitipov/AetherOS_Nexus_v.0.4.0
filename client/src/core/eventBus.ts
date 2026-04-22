type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

export type NotificationPayload = {
  title: string;
  message: string;
  icon?: string;
  duration?: number;
};

export type KernelFsErrorPayload = {
  path: string;
  reason: string;
};

export type KernelProcessCrashPayload = {
  pid: number;
};

export type SystemAlertPayload = {
  title: string;
  message: string;
};

type WindowState = "normal" | "minimized" | "maximized" | "closed";

type ContextMenuPosition = { x: number; y: number };

type DesktopContextTarget = {
  type: "desktop";
};

type FileContextTarget = {
  type: "file" | "app";
  path: string;
  name: string;
  source: "desktop" | "explorer";
  appId?: string;
  extension?: string;
  permissions?: {
    canRename?: boolean;
    canDelete?: boolean;
  };
};

type FolderContextTarget = {
  type: "folder";
  path: string;
  name: string;
  source: "desktop" | "explorer";
  permissions?: {
    canCreate?: boolean;
    canRename?: boolean;
    canDelete?: boolean;
  };
};

type WindowContextTarget = {
  id: string;
  title: string;
  state: WindowState;
};

type TaskbarContextTarget = {
  id: string;
  title?: string;
  isStartButton?: boolean;
};

type EventMap = {
  "window.open": { id: string; source?: string };
  "window.focus": { id: string; state?: WindowState };
  "window.create": {
    id: string;
    state?: WindowState;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
  "window.close": { id: string; state?: WindowState };
  "window.minimize": { id: string; state?: WindowState };
  "window.maximize": {
    id: string;
    state?: WindowState;
    size?: { width: number; height: number };
  };
  "window.move": { id: string; position?: { x: number; y: number } };
  "window.resize": {
    id: string;
    size?: { width: number; height: number };
    position?: { x: number; y: number };
  };
  "startmenu.toggle": { open?: boolean };
  "startmenu.open": Record<string, never>;
  "startmenu.close": Record<string, never>;
  "desktop.icon.launch": { appId: string; iconId?: string };
  "app.launch": { appId: string };
  "app.started": { appId: string; pid: number; windowId: string };
  "app.terminated": { appId: string; pid: number; windowId: string };
  "taskbar.button.click": { id: string };
  "contextmenu.desktop": {
    position: ContextMenuPosition;
    target: DesktopContextTarget;
  };
  "contextmenu.file": {
    position: ContextMenuPosition;
    target: FileContextTarget;
  };
  "contextmenu.folder": {
    position: ContextMenuPosition;
    target: FolderContextTarget;
  };
  "contextmenu.window": {
    position: ContextMenuPosition;
    target: WindowContextTarget;
  };
  "contextmenu.taskbar": {
    position: ContextMenuPosition;
    target: TaskbarContextTarget;
  };
  "notify.info": NotificationPayload;
  "notify.warning": NotificationPayload;
  "notify.error": NotificationPayload;
  "notify.success": NotificationPayload;
  "modal.open": import("@/modals/ModalManager").ModalDialog;
  "modal.close": Record<string, never>;
  "fs.error": KernelFsErrorPayload;
  "process.crash": KernelProcessCrashPayload;
  "network.down": Record<string, never>;
  "battery.low": Record<string, never>;
  "system.alert": SystemAlertPayload;
};

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  subscribe<TKey extends keyof EventMap>(
    eventName: TKey,
    handler: EventHandler<EventMap[TKey]>,
  ): () => void {
    const eventListeners = this.listeners.get(eventName) ?? new Set<EventHandler>();
    eventListeners.add(handler as EventHandler);
    this.listeners.set(eventName, eventListeners);

    return () => {
      const listenersForEvent = this.listeners.get(eventName);
      listenersForEvent?.delete(handler as EventHandler);

      if (!listenersForEvent || listenersForEvent.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<TKey extends keyof EventMap>(eventName: TKey, payload: EventMap[TKey]): void {
    const listenersForEvent = this.listeners.get(eventName);

    if (!listenersForEvent) {
      return;
    }

    listenersForEvent.forEach((handler) => {
      handler(payload);
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

export type {
  EventMap,
  EventHandler,
  WindowState,
  FileContextTarget,
  FolderContextTarget,
  WindowContextTarget,
  TaskbarContextTarget,
};
