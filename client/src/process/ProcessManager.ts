import type { OSProcess } from "@/process/types";

export class ProcessManager {
  private readonly processes = new Map<number, OSProcess>();
  private nextPid = 1;

  startProcess(appId: string): OSProcess {
    const pid = this.nextPid;
    this.nextPid += 1;

    const process: OSProcess = {
      pid,
      appId,
      windowId: `${appId}:${pid}`,
      state: "running",
      startTime: Date.now(),
    };

    this.processes.set(pid, process);

    return process;
  }

  terminateProcess(pid: number): void {
    const process = this.processes.get(pid);

    if (!process) {
      return;
    }

    process.state = "terminated";
    this.processes.delete(pid);
  }

  suspendProcess(pid: number): void {
    const process = this.processes.get(pid);

    if (!process || process.state !== "running") {
      return;
    }

    process.state = "suspended";
  }

  resumeProcess(pid: number): void {
    const process = this.processes.get(pid);

    if (!process || process.state !== "suspended") {
      return;
    }

    process.state = "running";
  }

  getProcess(pid: number): OSProcess | undefined {
    return this.processes.get(pid);
  }

  getProcessByWindowId(windowId: string): OSProcess | undefined {
    return Array.from(this.processes.values()).find((process) => process.windowId === windowId);
  }

  listProcesses(): OSProcess[] {
    return Array.from(this.processes.values());
  }
}
