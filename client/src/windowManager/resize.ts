import { OSWindow } from "@/windowManager/OSWindow";

const HANDLE_DIRECTIONS = [
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

type HandleDirection = (typeof HANDLE_DIRECTIONS)[number];

interface ResizeOptions {
  onResize?: (windowRef: OSWindow) => void;
}

export function attachWindowResize(windowRef: OSWindow, options: ResizeOptions = {}): () => void {
  if (!windowRef.resizable) {
    return () => undefined;
  }

  const unsubs = HANDLE_DIRECTIONS.map((direction) => {
    const handle = document.createElement("div");
    handle.className = direction;
    handle.dataset.resizeHandle = direction;
    windowRef.element.append(handle);

    return bindResizeHandle(windowRef, handle, direction, options);
  });

  return () => {
    unsubs.forEach((unsubscribe) => unsubscribe());
  };
}

function bindResizeHandle(
  windowRef: OSWindow,
  handle: HTMLElement,
  direction: HandleDirection,
  options: ResizeOptions,
): () => void {
  let active = false;
  let startX = 0;
  let startY = 0;
  let originWidth = 0;
  let originHeight = 0;
  let originX = 0;
  let originY = 0;
  const aspectRatio = windowRef.size.width / windowRef.size.height;

  const onMouseMove = (event: MouseEvent) => {
    if (!active) {
      return;
    }

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    let width = originWidth;
    let height = originHeight;
    let x = originX;
    let y = originY;

    if (direction.includes("right")) {
      width = originWidth + dx;
    }
    if (direction.includes("left")) {
      width = originWidth - dx;
      x = originX + dx;
    }
    if (direction.includes("bottom")) {
      height = originHeight + dy;
    }
    if (direction.includes("top")) {
      height = originHeight - dy;
      y = originY + dy;
    }

    width = Math.max(windowRef.minWidth, width);
    height = Math.max(windowRef.minHeight, height);

    if (windowRef.maintainAspectRatio) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        height = Math.max(windowRef.minHeight, width / aspectRatio);
      } else {
        width = Math.max(windowRef.minWidth, height * aspectRatio);
      }
    }

    if (direction.includes("left")) {
      x = originX + (originWidth - width);
    }
    if (direction.includes("top")) {
      y = originY + (originHeight - height);
    }

    windowRef.setPosition({ x, y });
    windowRef.setSize({ width, height });
    options.onResize?.(windowRef);
  };

  const onMouseUp = () => {
    active = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    active = true;
    startX = event.clientX;
    startY = event.clientY;
    originWidth = windowRef.size.width;
    originHeight = windowRef.size.height;
    originX = windowRef.position.x;
    originY = windowRef.position.y;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  handle.addEventListener("mousedown", onMouseDown);

  return () => {
    handle.removeEventListener("mousedown", onMouseDown);
    handle.remove();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}
