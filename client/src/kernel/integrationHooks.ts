export interface KernelAppInfo {
  id: string;
  name: string;
  icon: string;
  entryPoint: string;
}

export async function loadAppsFromKernel(): Promise<KernelAppInfo[]> {
  return [];
}

export function syncTaskbarStateWithKernel(): void {
  // Placeholder for future kernel process synchronization.
}
