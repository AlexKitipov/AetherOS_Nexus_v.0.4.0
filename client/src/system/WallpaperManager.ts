const DESKTOP_SELECTOR = "#desktop";

export class WallpaperManager {
  private wallpaper = "";

  setWallpaper(path: string): void {
    this.wallpaper = path;

    const desktop = document.querySelector<HTMLElement>(DESKTOP_SELECTOR);

    if (!desktop) {
      return;
    }

    desktop.style.backgroundImage = path ? `url(${path})` : "";
    desktop.style.backgroundSize = path ? "cover" : "";
    desktop.style.backgroundPosition = path ? "center center" : "";
    desktop.style.backgroundRepeat = path ? "no-repeat" : "";
  }

  getWallpaper(): string {
    return this.wallpaper;
  }
}

export const wallpaperManager = new WallpaperManager();
