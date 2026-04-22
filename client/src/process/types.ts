export interface AppMessage {
  from: number;
  to: number;
  type: string;
  payload?: unknown;
}

export interface OSProcess {
  pid: number;
  appId: string;
  windowId: string;
  state: "running" | "suspended" | "terminated";
  startTime: number;
}

export interface AppSandbox {
  pid: number;
  sendMessage: (msg: Omit<AppMessage, "from">) => void;
  getProcessInfo: () => OSProcess;
}

export interface OSApp {
  id: string;
  name: string;
  icon: string;
  entry: (sandbox: AppSandbox) => HTMLElement;
  onStart?: (sandbox: AppSandbox) => void;
  onClose?: (sandbox: AppSandbox) => void;
  onMessage?: (msg: AppMessage) => void;
}

export interface KernelProcessInfo {
  pid: number;
  appId: string;
  state: string;
}
