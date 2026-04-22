import { eventBus } from "@/core/eventBus";

export type NotificationType = "info" | "warning" | "error" | "success";

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  type: NotificationType;
  timestamp: number;
  duration?: number;
}

const MAX_VISIBLE_NOTIFICATIONS = 5;
const DEFAULT_DURATION_MS = 5_000;
const ERROR_DURATION_MS = 8_000;

export class NotificationManager {
  private notifications: Notification[] = [];
  private readonly timers = new Map<string, number>();

  constructor(private readonly root: HTMLElement) {
    this.root.id = this.root.id || "notification-center";
    this.bindEventBus();
    this.render();
  }

  push(notification: Notification): void {
    this.notifications = [notification, ...this.notifications].slice(0, MAX_VISIBLE_NOTIFICATIONS);

    if (this.timers.has(notification.id)) {
      const timerId = this.timers.get(notification.id);
      if (timerId) {
        window.clearTimeout(timerId);
      }
      this.timers.delete(notification.id);
    }

    const duration = notification.duration ?? (notification.type === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
    const timerId = window.setTimeout(() => {
      this.remove(notification.id);
    }, duration);

    this.timers.set(notification.id, timerId);
    this.render();
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);

    const timerId = this.timers.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
    }
    this.timers.delete(id);

    this.render();
  }

  clear(): void {
    this.notifications = [];
    this.timers.forEach((timerId) => window.clearTimeout(timerId));
    this.timers.clear();
    this.render();
  }

  render(): void {
    this.root.replaceChildren(...this.notifications.map((notification) => this.renderNotification(notification)));
  }

  private renderNotification(notification: Notification): HTMLElement {
    const card = document.createElement("article");
    card.className = `system-notification type-${notification.type}`;
    card.dataset.id = notification.id;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "notification-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", `Dismiss ${notification.title}`);
    closeButton.addEventListener("click", () => this.remove(notification.id));

    const title = document.createElement("h4");
    title.className = "notification-title";
    title.textContent = `${notification.icon ?? this.getDefaultIcon(notification.type)} ${notification.title}`.trim();

    const message = document.createElement("p");
    message.className = "notification-message";
    message.textContent = notification.message;

    const timestamp = document.createElement("time");
    timestamp.className = "notification-timestamp";
    timestamp.textContent = new Date(notification.timestamp).toLocaleTimeString();

    card.append(closeButton, title, message, timestamp);
    return card;
  }

  private bindEventBus(): void {
    eventBus.subscribe("notify.info", (payload) => this.push(this.toNotification("info", payload)));
    eventBus.subscribe("notify.warning", (payload) => this.push(this.toNotification("warning", payload)));
    eventBus.subscribe("notify.error", (payload) => this.push(this.toNotification("error", payload)));
    eventBus.subscribe("notify.success", (payload) => this.push(this.toNotification("success", payload)));

    eventBus.subscribe("fs.error", ({ path, reason }) => {
      this.push({
        id: this.createId("fs-error"),
        title: "Filesystem Error",
        message: `${path}: ${reason}`,
        type: "error",
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe("process.crash", ({ pid }) => {
      this.push({
        id: this.createId("process-crash"),
        title: "Process Crash",
        message: `Process ${pid} terminated unexpectedly.`,
        type: "error",
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe("network.down", () => {
      this.push({
        id: this.createId("network-down"),
        title: "Network Offline",
        message: "Network connection is unavailable.",
        type: "warning",
        timestamp: Date.now(),
      });
    });

    eventBus.subscribe("battery.low", () => {
      this.push({
        id: this.createId("battery-low"),
        title: "Battery Low",
        message: "Please connect to power soon.",
        type: "warning",
        timestamp: Date.now(),
      });
    });
  }

  private toNotification(
    type: NotificationType,
    payload: { title: string; message: string; icon?: string; duration?: number },
  ): Notification {
    return {
      id: this.createId(type),
      title: payload.title,
      message: payload.message,
      icon: payload.icon,
      duration: payload.duration,
      type,
      timestamp: Date.now(),
    };
  }

  private getDefaultIcon(type: NotificationType): string {
    switch (type) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "⨯";
      case "info":
      default:
        return "ℹ";
    }
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
