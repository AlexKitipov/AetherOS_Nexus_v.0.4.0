import { OSWindow } from "@/windowManager/OSWindow";

interface DragOptions {
  getBounds?: () => { width: number; height: number };
  onMove?: (windowRef: OSWindow) => void;
}

export function attachWindowDrag(windowRef: OSWindow, options: DragOptions = {}): () => void {
  const titlebar = windowRef.element.querySelector<HTMLElement>(".window-titlebar");

  if (!titlebar) {
    return () => undefined;
  }

  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;

  const onMouseMove = (event: MouseEvent) => {
    if (!dragging) {
      return;
    }

    const bounds = options.getBounds?.() ?? {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    const maxX = Math.max(0, bounds.width - windowRef.size.width);
    const maxY = Math.max(0, bounds.height - windowRef.size.height);

    const nextX = clamp(originX + deltaX, 0, maxX);
    const nextY = clamp(originY + deltaY, 0, maxY);

    windowRef.setPosition({ x: nextX, y: nextY });
    options.onMove?.(windowRef);
  };

  const onMouseUp = () => {
    dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (!windowRef.draggable || event.button !== 0) {
      return;
    }

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    originX = windowRef.position.x;
    originY = windowRef.position.y;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  titlebar.addEventListener("mousedown", onMouseDown);

  return () => {
    titlebar.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
