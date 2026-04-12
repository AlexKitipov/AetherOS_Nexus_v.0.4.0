import type {
  KernelEvent,
  KernelModule,
  KernelRequest,
  KernelResponse,
  KernelTask,
  StatusSnapshot,
} from "@/types/kernel";

export class MockKernelBackend {
  private readonly bootTime = Date.now();
  private readonly listeners = new Set<(event: KernelEvent) => void>();

  private readonly modules: KernelModule[] = [
    { id: "net", name: "Network Stack", mutable: true, state: "active" },
    { id: "sec", name: "Security Layer", mutable: false, state: "active" },
    { id: "ai", name: "Neural Engine", mutable: true, state: "active" },
  ];

  private tasks: KernelTask[] = [
    {
      id: "init-001",
      command: "boot:init-service",
      status: "completed",
      createdAt: new Date().toISOString(),
    },
  ];

  private eventInterval: ReturnType<typeof setInterval> | null = null;

  async handle(request: KernelRequest): Promise<KernelResponse> {
    try {
      switch (request.type) {
        case "inspect.status":
          return this.success(request.type, this.getStatusSnapshot());
        case "inspect.processes":
          return this.success(request.type, [...this.tasks]);
        case "task.run": {
          const createdTask = this.createTask(request.payload.command);
          this.emitEvent({
            event: "kernel.task",
            timestamp: new Date().toISOString(),
            payload: createdTask,
          });
          return this.success(request.type, createdTask);
        }
        case "task.manage": {
          const updated = this.updateTask(request.payload.taskId, request.payload.action);
          this.emitEvent({
            event: "kernel.task",
            timestamp: new Date().toISOString(),
            payload: updated,
          });
          return this.success(request.type, updated);
        }
        case "module.manage": {
          const updated = this.updateModule(request.payload.moduleId, request.payload.enabled);
          this.emitEvent({
            event: "kernel.notification",
            timestamp: new Date().toISOString(),
            payload: { moduleId: updated.id, state: updated.state },
          });
          return this.success(request.type, updated);
        }
      }
    } catch (error) {
      return this.failure(
        request.type,
        error instanceof Error ? error.message : "Mock kernel operation failed",
      );
    }
  }

  subscribe(listener: (event: KernelEvent) => void): () => void {
    this.listeners.add(listener);
    if (!this.eventInterval) {
      this.eventInterval = setInterval(() => {
        this.emitEvent({
          event: "kernel.log",
          timestamp: new Date().toISOString(),
          payload: { level: "info", message: "Mock kernel heartbeat" },
        });
      }, 5_000);
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.eventInterval) {
        clearInterval(this.eventInterval);
        this.eventInterval = null;
      }
    };
  }

  private emitEvent(event: KernelEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private getStatusSnapshot(): StatusSnapshot {
    return {
      cpu: 10 + Math.floor(Math.random() * 25),
      memory: 20 + Math.floor(Math.random() * 30),
      modules: [...this.modules],
      uptime: Math.floor((Date.now() - this.bootTime) / 1000),
      taskCount: this.tasks.length,
    };
  }

  private createTask(command: string): KernelTask {
    const task: KernelTask = {
      id: `task-${Date.now()}`,
      command,
      status: "running",
      createdAt: new Date().toISOString(),
    };

    this.tasks = [task, ...this.tasks].slice(0, 100);
    return task;
  }

  private updateTask(taskId: string, action: "stop" | "resume"): KernelTask {
    const target = this.tasks.find((task) => task.id === taskId);
    if (!target) {
      throw new Error(`Task '${taskId}' not found`);
    }

    target.status = action === "stop" ? "completed" : "running";
    return target;
  }

  private updateModule(moduleId: string, enabled: boolean): KernelModule {
    const target = this.modules.find((module) => module.id === moduleId);
    if (!target) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    if (!target.mutable) {
      throw new Error(`Module '${moduleId}' is immutable`);
    }

    target.state = enabled ? "active" : "inactive";
    return target;
  }

  private success(type: KernelRequest["type"], data: unknown): KernelResponse {
    return {
      ok: true,
      channel: "ui.bridge",
      type,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private failure(type: KernelRequest["type"], error: string): KernelResponse {
    return {
      ok: false,
      channel: "ui.bridge",
      type,
      timestamp: new Date().toISOString(),
      error,
    };
  }
}
