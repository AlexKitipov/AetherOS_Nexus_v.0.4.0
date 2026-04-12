export interface UIRoot {
  desktop: HTMLElement;
  taskbar: HTMLElement;
  startMenu: HTMLElement;
  windowLayer: HTMLElement;
  contextMenu: HTMLElement;
  systemOverlay: HTMLElement;
}

const REQUIRED_ROOT_IDS = {
  desktop: "desktop",
  taskbar: "taskbar",
  startMenu: "start-menu",
  windowLayer: "window-layer",
  contextMenu: "context-menu",
  systemOverlay: "system-overlay",
} as const;

const getRequiredElement = (id: string): HTMLElement => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required UI root element is missing: #${id}`);
  }

  return element;
};

export const uiRoot: UIRoot = {
  desktop: getRequiredElement(REQUIRED_ROOT_IDS.desktop),
  taskbar: getRequiredElement(REQUIRED_ROOT_IDS.taskbar),
  startMenu: getRequiredElement(REQUIRED_ROOT_IDS.startMenu),
  windowLayer: getRequiredElement(REQUIRED_ROOT_IDS.windowLayer),
  contextMenu: getRequiredElement(REQUIRED_ROOT_IDS.contextMenu),
  systemOverlay: getRequiredElement(REQUIRED_ROOT_IDS.systemOverlay),
};

export const getUIRoot = (): UIRoot => uiRoot;

export const getUIRootElement = <T extends keyof UIRoot>(key: T): UIRoot[T] =>
  uiRoot[key];
