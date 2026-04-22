import { configManager } from "@/system/ConfigManager";

export function render(container: HTMLElement): void {
  container.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Appearance";

  const themeLabel = document.createElement("label");
  themeLabel.textContent = "Theme";

  const themeSelect = document.createElement("select");
  ["default", "midnight", "light"].forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme;
    themeSelect.append(option);
  });
  themeSelect.value = configManager.get("theme");
  themeSelect.addEventListener("change", () => {
    configManager.set("theme", themeSelect.value);
  });

  const accentLabel = document.createElement("label");
  accentLabel.textContent = "Accent color";

  const accentInput = document.createElement("input");
  accentInput.type = "color";
  accentInput.value = configManager.get("accentColor");
  accentInput.addEventListener("input", () => {
    configManager.set("accentColor", accentInput.value);
  });

  const animationToggle = document.createElement("label");
  animationToggle.className = "settings-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = configManager.get("animations");
  checkbox.addEventListener("change", () => {
    configManager.set("animations", checkbox.checked);
  });

  const text = document.createElement("span");
  text.textContent = "Enable animations";

  animationToggle.append(checkbox, text);

  container.append(title, themeLabel, themeSelect, accentLabel, accentInput, animationToggle);
}
