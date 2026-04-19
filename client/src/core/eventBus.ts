type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

type WindowState = "normal" | "minimized" | "maximized" | "closed";

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
  "taskbar.button.click": { id: string };
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

export type { EventMap, EventHandler };
