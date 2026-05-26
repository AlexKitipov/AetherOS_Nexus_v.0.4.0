import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { KernelModule, KernelRequest as KernelCommand, KernelResponse as KernelCommandResponse, KernelTask, StatusSnapshot as KernelStatus } from "@/types/kernel";

export type KernelModuleStatus = KernelModule;

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
