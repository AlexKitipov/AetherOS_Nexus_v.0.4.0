import { getApp } from "@/apps/AppRegistry";
import { eventBus } from "@/core/eventBus";
import { MessageBus } from "@/process/MessageBus";
import { ProcessManager } from "@/process/ProcessManager";
import type { AppSandbox, KernelProcessInfo, OSProcess, AppMessage } from "@/process/types";
import { WindowManager } from "@/windowManager/WindowManager";

export class AppRuntime {
  private readonly processManager = new ProcessManager();
  private readonly messageBus = new MessageBus(this.processManager);
  private readonly sandboxes = new Map<number, AppSandbox>();

  constructor(private readonly windowManager: WindowManager) {
    eventBus.subscribe("window.close", ({ id }) => {
      const process = this.processManager.getProcessByWindowId(id);

      if (!process) {
        return;
      }

      this.cleanupProcess(process.pid, false);
    });
  }

  launchApp(appId: string): OSProcess | undefined {
    const app = getApp(appId);

    if (!app) {
      return undefined;
    }

    const process = this.processManager.startProcess(appId);
    const sandbox: AppSandbox = {
      pid: process.pid,
      sendMessage: (msg) => {
        this.messageBus.send({
          ...msg,
          from: process.pid,
        });
      },
      getProcessInfo: () => {
        const current = this.processManager.getProcess(process.pid);

        if (!current) {
          throw new Error(`Process ${process.pid} is not available.`);
        }

        return current;
      },
    };

    this.sandboxes.set(process.pid, sandbox);

    const root = app.entry(sandbox);

    this.windowManager.createWindow({
      id: process.windowId,
      title: app.name,
      icon: app.icon,
      content: root,
      width: 720,
      height: 480,
      position: { x: 140, y: 80 },
    });

    app.onStart?.(sandbox);
    eventBus.emit("app.started", {
      appId,
      pid: process.pid,
      windowId: process.windowId,
    });

    return process;
  }

  terminateProcess(pid: number): void {
    this.cleanupProcess(pid, true);
  }

  suspendProcess(pid: number): void {
    this.processManager.suspendProcess(pid);
  }

  resumeProcess(pid: number): void {
    this.processManager.resumeProcess(pid);
  }

  sendMessage(msg: AppMessage): void {
    this.messageBus.send(msg);
  }

  broadcast(type: string, payload?: unknown): void {
    this.messageBus.broadcast(type, payload);
  }

  listProcesses(): OSProcess[] {
    return this.processManager.listProcesses();
  }

  getProcess(pid: number): OSProcess | undefined {
    return this.processManager.getProcess(pid);
  }

  async requestKernelProcessList(): Promise<KernelProcessInfo[]> {
    return this.processManager.listProcesses().map((process) => ({
      pid: process.pid,
      appId: process.appId,
      state: process.state,
    }));
  }

  async requestKernelLaunch(appId: string): Promise<number> {
    const process = this.launchApp(appId);

    if (!process) {
      throw new Error(`App '${appId}' is not registered.`);
    }

    return process.pid;
  }

  async requestKernelTerminate(pid: number): Promise<void> {
    this.terminateProcess(pid);
  }

  async requestKernelMessage(msg: AppMessage): Promise<void> {
    this.sendMessage(msg);
  }

  private cleanupProcess(pid: number, closeWindow: boolean): void {
    const process = this.processManager.getProcess(pid);

    if (!process) {
      return;
    }

    const sandbox = this.sandboxes.get(pid);
    const app = getApp(process.appId);

    if (sandbox) {
      app?.onClose?.(sandbox);
    }

    if (closeWindow) {
      this.windowManager.closeWindow(process.windowId);
    }

    this.processManager.terminateProcess(pid);
    this.sandboxes.delete(pid);

    eventBus.emit("app.terminated", {
      appId: process.appId,
      pid: process.pid,
      windowId: process.windowId,
    });
  }
}
