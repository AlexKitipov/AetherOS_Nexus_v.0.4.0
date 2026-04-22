export interface SystemConfig {
  theme: string;
  wallpaper: string;
  accentColor: string;
  animations: boolean;
  defaultApps: Record<string, string>;
}

const CONFIG_STORAGE_KEY = "aetheros.system.config";

const DEFAULT_CONFIG: SystemConfig = {
  theme: "default",
  wallpaper: "",
  accentColor: "#4da3ff",
  animations: true,
  defaultApps: {
    txt: "text-editor",
    folder: "file-explorer",
    terminal: "terminal",
  },
};

export class ConfigManager {
  private static instance: ConfigManager | null = null;

  private config: SystemConfig = structuredClone(DEFAULT_CONFIG);
  private readonly listeners = new Set<(config: SystemConfig) => void>();

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }

    return ConfigManager.instance;
  }

  load(): void {
    const raw = globalThis.localStorage?.getItem(CONFIG_STORAGE_KEY);

    if (!raw) {
      this.config = structuredClone(DEFAULT_CONFIG);
      this.notify();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SystemConfig>;
      this.config = {
        ...structuredClone(DEFAULT_CONFIG),
        ...parsed,
        defaultApps: {
          ...DEFAULT_CONFIG.defaultApps,
          ...parsed.defaultApps,
        },
      };
    } catch {
      this.config = structuredClone(DEFAULT_CONFIG);
    }

    this.notify();
  }

  save(): void {
    globalThis.localStorage?.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
  }

  get<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
    return this.config[key];
  }

  set<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]): void {
    this.config = {
      ...this.config,
      [key]: value,
    };

    this.save();
    this.notify();
  }

  onChange(callback: (config: SystemConfig) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.config, defaultApps: { ...this.config.defaultApps } });

    return () => {
      this.listeners.delete(callback);
    };
  }

  getSnapshot(): SystemConfig {
    return {
      ...this.config,
      defaultApps: { ...this.config.defaultApps },
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((callback) => {
      callback(snapshot);
    });
  }
}

export const configManager = ConfigManager.getInstance();
