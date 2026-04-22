import { getApp, listApps } from "@/apps/AppRegistry";
import { ProcessManager } from "@/process/ProcessManager";
import type { AppMessage } from "@/process/types";

export class MessageBus {
  constructor(private readonly processManager: ProcessManager) {}

  send(msg: AppMessage): void {
    const recipient = this.processManager.getProcess(msg.to);

    if (!recipient || recipient.state === "terminated") {
      return;
    }

    const app = getApp(recipient.appId);
    app?.onMessage?.(msg);
  }

  broadcast(type: string, payload?: unknown): void {
    const appsById = new Map(listApps().map((app) => [app.id, app]));

    this.processManager.listProcesses().forEach((process) => {
      if (process.state === "terminated") {
        return;
      }

      const app = appsById.get(process.appId);
      app?.onMessage?.({
        from: 0,
        to: process.pid,
        type,
        payload,
      });
    });
  }
}
