import type { OSApp } from "@/process/types";

export class AppRegistry {
  private static instance: AppRegistry | null = null;
  private readonly apps = new Map<string, OSApp>();

  static getInstance(): AppRegistry {
    if (!AppRegistry.instance) {
      AppRegistry.instance = new AppRegistry();
    }

    return AppRegistry.instance;
  }

  register(app: OSApp): void {
    this.apps.set(app.id, app);
  }

  unregister(id: string): void {
    this.apps.delete(id);
  }

  get(id: string): OSApp | undefined {
    return this.apps.get(id);
  }

  list(): OSApp[] {
    return Array.from(this.apps.values());
  }
}

const appRegistry = AppRegistry.getInstance();

export function registerApp(app: OSApp): void {
  appRegistry.register(app);
}

export function unregisterApp(id: string): void {
  appRegistry.unregister(id);
}

export function getApp(id: string): OSApp | undefined {
  return appRegistry.get(id);
}

export function listApps(): OSApp[] {
  return appRegistry.list();
}
