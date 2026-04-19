import { eventBus } from "@/core/eventBus";
import { getUIRoot } from "@/core/uiRoot";
import { TaskbarManager } from "@/taskbar/TaskbarManager";
import { StartMenuManager } from "@/startmenu/StartMenuManager";
import { getApp, listApps } from "@/apps/AppRegistry";
import { WindowManager } from "@/windowManager/WindowManager";

export function initializeShellArchitecture(): void {
  const uiRoot = getUIRoot();
  const taskbarManager = new TaskbarManager(uiRoot.taskbar);
  const startMenuManager = new StartMenuManager(uiRoot.startMenu);
  const windowManager = WindowManager.getInstance(uiRoot.windowLayer);

  startMenuManager.setApps(listApps());

  eventBus.subscribe("desktop.icon.launch", ({ appId }) => {
    eventBus.emit("app.launch", { appId });
  });

  eventBus.subscribe("app.launch", ({ appId }) => {
    const app = getApp(appId);
    app?.launch();
  });

  eventBus.subscribe("taskbar.button.click", ({ id }) => {
    if (id === "start") {
      return;
    }

    const targetWindow = windowManager.getWindow(id);

    if (!targetWindow || targetWindow.state === "closed") {
      return;
    }

    if (targetWindow.state === "minimized") {
      windowManager.focusWindow(id);
      return;
    }

    if (windowManager.getActiveWindowId() === id) {
      windowManager.minimizeWindow(id);
      return;
    }

    windowManager.focusWindow(id);
  });

  void taskbarManager;
}
