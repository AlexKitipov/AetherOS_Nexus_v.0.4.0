export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  launch: () => void;
}

const apps: AppDefinition[] = [];

export function registerApp(app: AppDefinition): void {
  const existingIndex = apps.findIndex((entry) => entry.id === app.id);

  if (existingIndex >= 0) {
    apps.splice(existingIndex, 1, app);
    return;
  }

  apps.push(app);
}

export function getApp(id: string): AppDefinition | undefined {
  return apps.find((app) => app.id === id);
}

export function listApps(): AppDefinition[] {
  return [...apps];
}
