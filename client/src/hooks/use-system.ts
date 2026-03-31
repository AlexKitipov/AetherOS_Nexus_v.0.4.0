import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export type SystemStatus = {
  cpu: number;
  memory: number;
  modules: string[];
  uptime: number;
};

// Fake data generator if API isn't ready, or use actual API
export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      // Simulate API call delay
      // const res = await fetch(api.system.status.path);
      // return await res.json() as SystemStatus;
      
      // Mock data for visual flair
      return {
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 40) + 20,
        modules: ["KERNEL_V.0.1", "NET_STACK", "SEC_LAYER", "AI_CORE"],
        uptime: Date.now()
      } as SystemStatus;
    },
    refetchInterval: 2000, // Update every 2 seconds
  });
}
