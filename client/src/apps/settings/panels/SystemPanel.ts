import { configManager } from "@/system/ConfigManager";

export function render(container: HTMLElement): void {
  container.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "System";

  const summary = document.createElement("p");
  summary.textContent = "Kernel-level controls will be connected through integration hooks.";

  const defaults = document.createElement("pre");
  defaults.textContent = JSON.stringify(configManager.get("defaultApps"), null, 2);

  container.append(title, summary, defaults);
}
