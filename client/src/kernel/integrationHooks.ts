import type { VFSNode } from "@/filesystem/VirtualFS";

export interface KernelAppInfo {
  id: string;
  name: string;
  icon: string;
  entryPoint: string;
}

export interface KernelFileInfo {
  path: string;
  name: string;
  type: "file" | "folder";
  size: number;
  updatedAt: string;
}

const EMPTY_FS_ROOT: VFSNode = {
  id: "root",
  name: "/",
  type: "folder",
  children: [],
};

export async function loadAppsFromKernel(): Promise<KernelAppInfo[]> {
  return [];
}

export function syncTaskbarStateWithKernel(): void {
  // Placeholder for future kernel process synchronization.
}

export async function syncDesktopWithKernel(): Promise<void> {
  // Placeholder: will sync desktop icons and metadata with kernel-side VFS.
}

export async function loadFSFromKernel(): Promise<VFSNode> {
  return structuredClone(EMPTY_FS_ROOT);
}

export async function saveFSChangesToKernel(): Promise<void> {
  // Placeholder: will persist VFS mutations through kernel bridge.
}

export async function requestKernelFileDelete(path: string): Promise<void> {
  void path;
  return Promise.resolve();
}

export async function requestKernelFileProperties(path: string): Promise<KernelFileInfo> {
  return Promise.resolve({
    path,
    name: path.split("/").filter(Boolean).at(-1) ?? "",
    type: "file",
    size: 0,
    updatedAt: new Date(0).toISOString(),
  });
}

export async function requestKernelAppLaunch(appId: string): Promise<void> {
  void appId;
  return Promise.resolve();
}

export interface KernelConfig {
  scheduler?: string;
  netstack?: string;
  telemetry?: boolean;
}

export interface SystemInfo {
  kernelVersion: string;
  uptimeMs: number;
  cpuModel: string;
}

export async function requestKernelConfig(): Promise<KernelConfig> {
  return Promise.resolve({});
}

export async function updateKernelConfig(config: KernelConfig): Promise<void> {
  void config;
  return Promise.resolve();
}

export async function requestKernelSystemInfo(): Promise<SystemInfo> {
  return Promise.resolve({
    kernelVersion: "unknown",
    uptimeMs: 0,
    cpuModel: "unknown",
  });
}
