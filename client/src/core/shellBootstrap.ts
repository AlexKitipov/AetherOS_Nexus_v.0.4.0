import { eventBus } from "@/core/eventBus";
import { getUIRoot } from "@/core/uiRoot";
import { TaskbarManager } from "@/taskbar/TaskbarManager";
import { StartMenuManager } from "@/startmenu/StartMenuManager";
import { getApp, listApps, registerApp } from "@/apps/AppRegistry";
import { WindowManager } from "@/windowManager/WindowManager";
import { DesktopManager } from "@/desktop/DesktopManager";
import { VirtualFS } from "@/filesystem/VirtualFS";
import { launchFileExplorer } from "@/apps/fileExplorer/FileExplorer";
import { ContextMenuManager } from "@/contextmenu/ContextMenuManager";

export function initializeShellArchitecture(): void {
  const uiRoot = getUIRoot();
  const taskbarManager = new TaskbarManager(uiRoot.taskbar);
  const startMenuManager = new StartMenuManager(uiRoot.startMenu);
  const windowManager = WindowManager.getInstance(uiRoot.windowLayer);

  const virtualFS = new VirtualFS();
  seedDesktopFS(virtualFS);


  registerApp({
    id: "file-explorer",
    name: "File Explorer",
    icon: "📁",
    launch: () => {
      launchFileExplorer("/desktop", {
        virtualFS,
        windowManager,
      });
    },
  });
  const desktopManager = new DesktopManager({
    desktopRoot: uiRoot.desktop,
    virtualFS,
    windowManager,
  });
  const contextMenuManager = new ContextMenuManager({
    root: uiRoot.contextMenu,
    windowManager,
    onRefreshDesktop: () => desktopManager.loadDesktopFromFS(),
  });

  desktopManager.loadDesktopFromFS();

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
  void contextMenuManager;
}

function seedDesktopFS(virtualFS: VirtualFS): void {
  virtualFS.createFolder("/", "desktop");
  virtualFS.createFolder("/desktop", "Documents");
  virtualFS.createFile("/desktop", "welcome.txt", "Welcome to AetherOS Nexus desktop.");

  virtualFS.updateNode("/desktop/Documents", (node) => {
    node.metadata = {
      icon: "/icons/folder.svg",
      iconPosition: { x: 0, y: 0 },
    };
  });

  virtualFS.updateNode("/desktop/welcome.txt", (node) => {
    node.metadata = {
      icon: "/icons/file.svg",
      iconPosition: { x: 0, y: 80 },
    };
  });
}
