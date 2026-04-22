import type { VirtualFS } from "@/filesystem/VirtualFS";
import type { AppRuntime } from "@/process/AppRuntime";

interface ShellServices {
  virtualFS?: VirtualFS;
  appRuntime?: AppRuntime;
}

const shellServices: ShellServices = {};

export function setShellServices(services: ShellServices): void {
  shellServices.virtualFS = services.virtualFS;
  shellServices.appRuntime = services.appRuntime;
}

export function getVirtualFS(): VirtualFS | undefined {
  return shellServices.virtualFS;
}

export function getAppRuntime(): AppRuntime | undefined {
  return shellServices.appRuntime;
}
