import * as AppearancePanel from "@/apps/settings/panels/AppearancePanel";
import * as WallpaperPanel from "@/apps/settings/panels/WallpaperPanel";
import * as SystemPanel from "@/apps/settings/panels/SystemPanel";
import * as AppsPanel from "@/apps/settings/panels/AppsPanel";

type SettingsCategory = "Appearance" | "Wallpaper" | "System" | "Apps" | "Network (future)" | "Kernel (future)";

type PanelRenderer = {
  render: (container: HTMLElement) => void;
};

const CATEGORIES: SettingsCategory[] = [
  "Appearance",
  "Wallpaper",
  "System",
  "Apps",
  "Network (future)",
  "Kernel (future)",
];

const PANEL_BY_CATEGORY: Partial<Record<SettingsCategory, PanelRenderer>> = {
  Appearance: AppearancePanel,
  Wallpaper: WallpaperPanel,
  System: SystemPanel,
  Apps: AppsPanel,
};

export class SettingsApp {
  windowId: string;
  activeCategory: SettingsCategory;

  private readonly root: HTMLElement;
  private readonly sidebar: HTMLElement;
  private readonly content: HTMLElement;

  constructor(windowId = "settings") {
    this.windowId = windowId;
    this.activeCategory = "Appearance";

    this.root = document.createElement("div");
    this.root.className = "settings-app";

    this.sidebar = document.createElement("div");
    this.sidebar.className = "settings-sidebar";

    this.content = document.createElement("div");
    this.content.className = "settings-content";

    this.root.append(this.sidebar, this.content);

    this.renderSidebar();
    this.renderContent();
  }

  getElement(): HTMLElement {
    return this.root;
  }

  renderSidebar(): void {
    this.sidebar.innerHTML = "";

    CATEGORIES.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "settings-category";
      button.dataset.active = String(this.activeCategory === category);
      button.textContent = category;
      button.addEventListener("click", () => this.switchCategory(category));
      this.sidebar.append(button);
    });
  }

  renderContent(): void {
    this.content.innerHTML = "";

    const panel = PANEL_BY_CATEGORY[this.activeCategory];

    if (!panel) {
      const placeholder = document.createElement("p");
      placeholder.textContent = `${this.activeCategory} is reserved for future integration.`;
      this.content.append(placeholder);
      return;
    }

    panel.render(this.content);
  }

  switchCategory(category: string): void {
    if (!CATEGORIES.includes(category as SettingsCategory)) {
      return;
    }

    this.activeCategory = category as SettingsCategory;
    this.renderSidebar();
    this.renderContent();
  }
}

export function createSettingsApp(windowId: string): HTMLElement {
  const app = new SettingsApp(windowId);
  return app.getElement();
}
