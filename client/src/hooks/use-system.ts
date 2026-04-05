import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export type KernelModuleStatus = {
  id: string;
  name: string;
  mutable: boolean;
  state: "active" | "inactive";
};

export type KernelTask = {
  id: string;
  command: string;
  status: "queued" | "running" | "completed";
  createdAt: string;
};

export type KernelStatus = {
  cpu: number;
  memory: number;
  modules: KernelModuleStatus[];
  uptime: number;
  taskCount: number;
};

export type KernelCommand =
  | { type: "inspect.status" }
  | { type: "inspect.processes" }
  | { type: "task.run"; payload: { command: string } }
  | { type: "task.manage"; payload: { action: "stop" | "resume"; taskId: string } }
  | { type: "module.manage"; payload: { moduleId: string; enabled: boolean } };

export type KernelCommandResponse = {
  ok: boolean;
  channel: "ui.bridge";
  type: string;
  timestamp: string;
  data?: unknown;
  error?: string;
};

export function useKernelStatus() {
  return useQuery({
    queryKey: [api.kernel.status.path],
    queryFn: async () => {
      const res = await fetch(api.kernel.status.path);
      if (!res.ok) throw new Error("Failed to fetch kernel status");
      return await res.json() as KernelStatus;
    },
    refetchInterval: 2000,
  });
}

export function useKernelTasks() {
  return useQuery({
    queryKey: [api.kernel.processes.path],
    queryFn: async () => {
      const res = await fetch(api.kernel.processes.path);
      if (!res.ok) throw new Error("Failed to fetch kernel tasks");
      return await res.json() as KernelTask[];
    },
    refetchInterval: 2000,
  });
}

export async function sendKernelCommand(command: KernelCommand) {
  const response = await fetch(api.kernel.command.path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const payload = await response.json() as KernelCommandResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Kernel command rejected");
  }

  return payload;
}
