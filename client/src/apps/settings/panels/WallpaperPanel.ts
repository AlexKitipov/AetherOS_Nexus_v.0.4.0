import { configManager } from "@/system/ConfigManager";

export function render(container: HTMLElement): void {
  container.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Wallpaper";

  const inputLabel = document.createElement("label");
  inputLabel.textContent = "Wallpaper URL";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "https://example.com/wallpaper.jpg";
  input.value = configManager.get("wallpaper");

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Apply wallpaper";
  saveButton.addEventListener("click", () => {
    configManager.set("wallpaper", input.value.trim());
  });

  container.append(title, inputLabel, input, saveButton);
}
