import { eventBus } from "@/core/eventBus";

export interface ModalButton {
  label: string;
  action: () => void;
  type?: "primary" | "secondary" | "danger";
}

export interface ModalDialog {
  id: string;
  title: string;
  message: string;
  buttons: ModalButton[];
}

export class ModalManager {
  private activeModal: ModalDialog | null = null;

  constructor(private readonly root: HTMLElement) {
    this.root.id = this.root.id || "modal-container";
    this.bindEventBus();
    this.render();
  }

  open(dialog: ModalDialog): void {
    this.activeModal = dialog;
    this.render();
  }

  close(): void {
    this.activeModal = null;
    this.render();
  }

  render(): void {
    this.root.replaceChildren();

    if (!this.activeModal) {
      this.root.dataset.open = "false";
      return;
    }

    this.root.dataset.open = "true";

    const backdrop = document.createElement("div");
    backdrop.className = "system-modal-backdrop";

    const modal = document.createElement("section");
    modal.className = "system-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${this.activeModal.id}-title`);

    const title = document.createElement("h3");
    title.id = `${this.activeModal.id}-title`;
    title.className = "system-modal-title";
    title.textContent = this.activeModal.title;

    const message = document.createElement("p");
    message.className = "system-modal-message";
    message.textContent = this.activeModal.message;

    const actions = document.createElement("div");
    actions.className = "system-modal-actions";

    this.activeModal.buttons.forEach((buttonConfig) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `system-modal-button ${buttonConfig.type ?? "secondary"}`;
      button.textContent = buttonConfig.label;
      button.addEventListener("click", () => {
        buttonConfig.action();
      });
      actions.append(button);
    });

    modal.append(title, message, actions);
    this.root.append(backdrop, modal);
  }

  private bindEventBus(): void {
    eventBus.subscribe("modal.open", (payload) => {
      this.open(payload);
    });

    eventBus.subscribe("modal.close", () => {
      this.close();
    });

    eventBus.subscribe("system.alert", ({ title, message }) => {
      this.open({
        id: `system-alert-${Date.now()}`,
        title,
        message,
        buttons: [{ label: "OK", action: () => this.close(), type: "primary" }],
      });
    });
  }
}
