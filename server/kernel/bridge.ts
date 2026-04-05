export type KernelCapability = "kernel.inspect" | "task.run" | "task.manage" | "module.manage";

export type KernelRole = "viewer" | "operator" | "admin";

export type InterfaceSession = {
  sessionId: string;
  role: KernelRole;
  capabilities: KernelCapability[];
};

export type KernelTask = {
  id: string;
  command: string;
  status: "queued" | "running" | "completed";
  createdAt: string;
};

export type KernelModule = {
  id: string;
  name: string;
  mutable: boolean;
  state: "active" | "inactive";
};

export type KernelCommand =
  | { type: "inspect.status" }
  | { type: "inspect.processes" }
  | { type: "task.run"; payload: { command: string } }
  | { type: "task.manage"; payload: { action: "stop" | "resume"; taskId: string } }
  | { type: "module.manage"; payload: { moduleId: string; enabled: boolean } };

export type KernelResponse = {
  ok: boolean;
  channel: "ui.bridge";
  type: KernelCommand["type"];
  timestamp: string;
  data?: unknown;
  error?: string;
};

const ROLE_CAPABILITIES: Record<KernelRole, KernelCapability[]> = {
  viewer: ["kernel.inspect"],
  operator: ["kernel.inspect", "task.run", "task.manage"],
  admin: ["kernel.inspect", "task.run", "task.manage", "module.manage"],
};

export class NexusKernelBridge {
  private readonly kernelBootAt = Date.now();

  private readonly modules: KernelModule[] = [
    { id: "net", name: "Network Stack", mutable: true, state: "active" },
    { id: "sec", name: "Security Layer", mutable: false, state: "active" },
    { id: "ai", name: "Neural Engine", mutable: true, state: "active" },
    { id: "db", name: "Data Persistence", mutable: true, state: "active" },
    { id: "io", name: "I/O Controller", mutable: true, state: "active" },
    { id: "virt", name: "Virtualization", mutable: true, state: "inactive" },
  ];

  private tasks: KernelTask[] = [
    {
      id: "init-001",
      command: "boot:init-service",
      status: "completed",
      createdAt: new Date().toISOString(),
    },
  ];

  dispatch(session: InterfaceSession, command: KernelCommand): KernelResponse {
    const commandType = command.type;

    try {
      this.authorize(session, command);

      switch (commandType) {
        case "inspect.status": {
          return this.ok(commandType, this.getStatusSnapshot());
        }
        case "inspect.processes": {
          return this.ok(commandType, this.getTaskSnapshot());
        }
        case "task.run": {
          const created = this.runTask(command.payload.command);
          return this.ok(commandType, created);
        }
        case "task.manage": {
          const updated = this.manageTask(command.payload.taskId, command.payload.action);
          return this.ok(commandType, updated);
        }
        case "module.manage": {
          const updated = this.manageModule(command.payload.moduleId, command.payload.enabled);
          return this.ok(commandType, updated);
        }
        default: {
          const unreachable: never = command;
          return this.fail(commandType, "Unsupported command");
        }
      }
    } catch (error) {
      return this.fail(commandType, error instanceof Error ? error.message : "Kernel bridge failure");
    }
  }

  getStatusSnapshot() {
    const cpu = 12 + Math.floor(Math.random() * 24);
    const memory = 28 + Math.floor(Math.random() * 18);

    return {
      cpu,
      memory,
      modules: this.modules,
      uptime: Math.floor((Date.now() - this.kernelBootAt) / 1000),
      taskCount: this.tasks.length,
    };
  }

  getTaskSnapshot() {
    return this.tasks
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private runTask(command: string): KernelTask {
    const task: KernelTask = {
      id: `task-${Date.now()}`,
      command,
      status: "running",
      createdAt: new Date().toISOString(),
    };

    this.tasks = [task, ...this.tasks].slice(0, 50);

    setTimeout(() => {
      this.tasks = this.tasks.map((entry) =>
        entry.id === task.id && entry.status === "running"
          ? { ...entry, status: "completed" }
          : entry,
      );
    }, 2_000);

    return task;
  }

  private manageTask(taskId: string, action: "stop" | "resume") {
    let found = false;

    this.tasks = this.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      found = true;
      if (action === "stop") {
        return { ...task, status: "completed" };
      }

      return { ...task, status: "running" };
    });

    if (!found) {
      throw new Error(`Task '${taskId}' was not found`);
    }

    return this.tasks.find((task) => task.id === taskId);
  }

  private manageModule(moduleId: string, enabled: boolean) {
    let found = false;

    const updatedModules = this.modules.map((module) => {
      if (module.id !== moduleId) {
        return module;
      }

      found = true;
      if (!module.mutable) {
        throw new Error(`Module '${moduleId}' is immutable in this kernel profile`);
      }

      return {
        ...module,
        state: enabled ? ("active" as const) : ("inactive" as const),
      };
    });

    if (!found) {
      throw new Error(`Module '${moduleId}' was not found`);
    }

    updatedModules.forEach((module, index) => {
      this.modules[index] = module;
    });

    return this.modules.find((module) => module.id === moduleId);
  }

  private authorize(session: InterfaceSession, command: KernelCommand) {
    const requiredCapability = this.requiredCapability(command.type);
    const sessionCapabilities = new Set(session.capabilities);

    if (!sessionCapabilities.has(requiredCapability)) {
      throw new Error(`Capability '${requiredCapability}' required for '${command.type}'`);
    }
  }

  private requiredCapability(type: KernelCommand["type"]): KernelCapability {
    if (type.startsWith("inspect.")) {
      return "kernel.inspect";
    }

    if (type === "task.run") {
      return "task.run";
    }

    if (type === "task.manage") {
      return "task.manage";
    }

    return "module.manage";
  }

  private ok(type: KernelCommand["type"], data: unknown): KernelResponse {
    return {
      ok: true,
      channel: "ui.bridge",
      type,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private fail(type: KernelCommand["type"], error: string): KernelResponse {
    return {
      ok: false,
      channel: "ui.bridge",
      type,
      timestamp: new Date().toISOString(),
      error,
    };
  }
}

export function createInterfaceSession(role: KernelRole = "operator"): InterfaceSession {
  return {
    sessionId: `ui-session-${Date.now()}`,
    role,
    capabilities: [...ROLE_CAPABILITIES[role]],
  };
}
