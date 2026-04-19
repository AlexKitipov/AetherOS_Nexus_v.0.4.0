import type { VFSNode } from "@/filesystem/VirtualFS";

export interface KernelAppInfo {
  id: string;
  name: string;
  icon: string;
  entryPoint: string;
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
