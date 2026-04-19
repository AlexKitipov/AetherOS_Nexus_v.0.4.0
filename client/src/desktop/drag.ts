import type { VFSPosition } from "@/filesystem/VirtualFS";

export const DESKTOP_GRID_SIZE = 80;

export interface DragBounds {
  width: number;
  height: number;
}

export type OccupancyLookup = (position: VFSPosition, iconId: string) => boolean;

export function snapToGrid(position: VFSPosition, gridSize = DESKTOP_GRID_SIZE): VFSPosition {
  return {
    x: Math.max(0, Math.round(position.x / gridSize) * gridSize),
    y: Math.max(0, Math.round(position.y / gridSize) * gridSize),
  };
}

export function normalizeToBounds(position: VFSPosition, bounds: DragBounds, gridSize = DESKTOP_GRID_SIZE): VFSPosition {
  const maxX = Math.max(0, bounds.width - gridSize);
  const maxY = Math.max(0, bounds.height - gridSize);

  return {
    x: Math.max(0, Math.min(position.x, maxX)),
    y: Math.max(0, Math.min(position.y, maxY)),
  };
}

export function findAvailableGridSlot(
  desiredPosition: VFSPosition,
  iconId: string,
  isOccupied: OccupancyLookup,
  bounds: DragBounds,
  gridSize = DESKTOP_GRID_SIZE,
): VFSPosition {
  const start = snapToGrid(normalizeToBounds(desiredPosition, bounds, gridSize), gridSize);

  if (!isOccupied(start, iconId)) {
    return start;
  }

  const columns = Math.max(1, Math.floor(bounds.width / gridSize));
  const rows = Math.max(1, Math.floor(bounds.height / gridSize));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const candidate = { x: col * gridSize, y: row * gridSize };

      if (!isOccupied(candidate, iconId)) {
        return candidate;
      }
    }
  }

  return start;
}

export interface DesktopDragHandlers {
  getBounds: () => DragBounds;
  isOccupied: OccupancyLookup;
  onDrop: (id: string, position: VFSPosition) => void;
}

export function attachDesktopIconDrag(element: HTMLElement, id: string, handlers: DesktopDragHandlers): () => void {
  let dragOffset: VFSPosition | null = null;

  const onPointerDown = (event: PointerEvent) => {
    dragOffset = {
      x: event.clientX - element.offsetLeft,
      y: event.clientY - element.offsetTop,
    };

    element.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragOffset) {
      return;
    }

    const bounds = handlers.getBounds();
    const unclamped = {
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y,
    };

    const nextPosition = findAvailableGridSlot(unclamped, id, handlers.isOccupied, bounds);
    element.style.left = `${nextPosition.x}px`;
    element.style.top = `${nextPosition.y}px`;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragOffset) {
      return;
    }

    dragOffset = null;
    element.releasePointerCapture(event.pointerId);

    handlers.onDrop(id, {
      x: element.offsetLeft,
      y: element.offsetTop,
    });
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
  };
}
