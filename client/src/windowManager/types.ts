export type WindowState = "normal" | "minimized" | "maximized" | "closed";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowConfig {
  id?: string;
  title: string;
  width: number;
  height: number;
  icon?: string;
  content?: HTMLElement | string;
  resizable?: boolean;
  draggable?: boolean;
  position?: WindowPosition;
  maintainAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface WindowSnapshot {
  id: string;
  position: WindowPosition;
  size: WindowSize;
  state: WindowState;
}

export interface WindowEventPayload {
  id: string;
  state?: WindowState;
  position?: WindowPosition;
  size?: WindowSize;
}
