type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

type EventMap = {
  "window.open": { id: string; source?: string };
  "window.focus": { id: string };
  "startmenu.toggle": { open?: boolean };
  "desktop.icon.launch": { appId: string; iconId?: string };
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

  emit<TKey extends keyof EventMap>(
    eventName: TKey,
    payload: EventMap[TKey],
  ): void {
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
