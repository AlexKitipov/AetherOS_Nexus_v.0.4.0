import { eventBus } from "@/core/eventBus";
import { getUIRoot } from "@/core/uiRoot";
import { TaskbarManager } from "@/taskbar/TaskbarManager";
import { StartMenuManager } from "@/startmenu/StartMenuManager";
import { listApps, registerApp } from "@/apps/AppRegistry";
import { WindowManager } from "@/windowManager/WindowManager";
import { DesktopManager } from "@/desktop/DesktopManager";
import { VirtualFS } from "@/filesystem/VirtualFS";
import { ContextMenuManager } from "@/contextmenu/ContextMenuManager";
import { NotificationManager } from "@/notifications/NotificationManager";
import { ModalManager } from "@/modals/ModalManager";
import { AppRuntime } from "@/process/AppRuntime";
import { SystemApps } from "@/apps/system/SystemApps";

export function initializeShellArchitecture(): void {
  const uiRoot = getUIRoot();
  const taskbarManager = new TaskbarManager(uiRoot.taskbar);
  const startMenuManager = new StartMenuManager(uiRoot.startMenu);
  const windowManager = WindowManager.getInstance(uiRoot.windowLayer);
  const appRuntime = new AppRuntime(windowManager);

  const virtualFS = new VirtualFS();
  seedDesktopFS(virtualFS);

  registerSystemApps();

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

  const notificationCenter = ensureOverlayChild(uiRoot.systemOverlay, "notification-center");
  const modalContainer = ensureOverlayChild(uiRoot.systemOverlay, "modal-container");
  const notificationManager = new NotificationManager(notificationCenter);
  const modalManager = new ModalManager(modalContainer);

  desktopManager.loadDesktopFromFS();

  startMenuManager.setApps(listApps());

  eventBus.subscribe("desktop.icon.launch", ({ appId }) => {
    eventBus.emit("app.launch", { appId });
  });

  eventBus.subscribe("app.launch", ({ appId }) => {
    appRuntime.launchApp(appId);
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
  void notificationManager;
  void modalManager;
}

function registerSystemApps(): void {
  registerApp(SystemApps.FileExplorer);
  registerApp(SystemApps.TerminalEmulator);
  registerApp(SystemApps.Settings);
  registerApp(SystemApps.TextEditor);
  registerApp(SystemApps.ProcessManager);
}

function ensureOverlayChild(root: HTMLElement, id: string): HTMLElement {
  const existing = root.querySelector<HTMLElement>(`#${id}`);

  if (existing) {
    return existing;
  }

  const element = document.createElement("div");
  element.id = id;
  root.append(element);

  return element;
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
