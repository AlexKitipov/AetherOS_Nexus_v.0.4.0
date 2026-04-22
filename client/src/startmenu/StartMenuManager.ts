import { eventBus } from "@/core/eventBus";
import type { OSApp } from "@/process/types";

export class StartMenuManager {
  private readonly appGrid: HTMLElement;
  private readonly searchContainer: HTMLElement;
  private readonly searchInput: HTMLInputElement;
  private apps: OSApp[] = [];
  private visible = false;

  constructor(private readonly root: HTMLElement) {
    this.appGrid = ensureChild(root, "start-menu-app-grid");
    this.searchContainer = ensureChild(root, "start-menu-search");
    this.searchInput = this.ensureSearchInput(this.searchContainer);

    this.root.hidden = true;

    this.searchInput.addEventListener("input", () => {
      const term = this.searchInput.value.trim().toLowerCase();
      const filtered = this.apps.filter((app) => app.name.toLowerCase().includes(term));
      this.renderApps(filtered);
    });

    eventBus.subscribe("startmenu.toggle", () => this.toggle());
    eventBus.subscribe("startmenu.open", () => this.open());
    eventBus.subscribe("startmenu.close", () => this.close());
  }

  open(): void {
    this.visible = true;
    this.root.hidden = false;
  }

  close(): void {
    this.visible = false;
    this.root.hidden = true;
  }

  toggle(): void {
    if (this.visible) {
      this.close();
      return;
    }

    this.open();
  }

  renderApps(apps: OSApp[]): void {
    this.appGrid.innerHTML = "";

    apps.forEach((app) => {
      const appButton = document.createElement("button");
      appButton.type = "button";
      appButton.dataset.appId = app.id;
      appButton.textContent = `${app.icon} ${app.name}`;

      appButton.addEventListener("click", () => {
        this.close();
        eventBus.emit("app.launch", { appId: app.id });
      });

      this.appGrid.append(appButton);
    });
  }

  setApps(apps: OSApp[]): void {
    this.apps = apps;
    this.renderApps(apps);
  }

  private ensureSearchInput(container: HTMLElement): HTMLInputElement {
    const existing = container.querySelector<HTMLInputElement>("input");

    if (existing) {
      return existing;
    }

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Search apps";
    container.append(input);

    return input;
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
