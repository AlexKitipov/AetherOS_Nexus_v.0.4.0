import { configManager } from "@/system/ConfigManager";

export function render(container: HTMLElement): void {
  container.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = "Apps";

  const description = document.createElement("p");
  description.textContent = "Configure default apps by extension.";

  const editorLabel = document.createElement("label");
  editorLabel.textContent = "Default TXT app";

  const editorInput = document.createElement("input");
  editorInput.type = "text";
  editorInput.value = configManager.get("defaultApps").txt ?? "";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save app defaults";
  saveButton.addEventListener("click", () => {
    const previous = configManager.get("defaultApps");
    configManager.set("defaultApps", {
      ...previous,
      txt: editorInput.value.trim() || previous.txt,
    });
  });

  container.append(title, description, editorLabel, editorInput, saveButton);
}
