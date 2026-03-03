import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { getEntityBBox } from "../../../utils/entityBBox";
import type { Point2D, Rect, ScreenBBox } from "./useSmartBoxSelection.types";
import { BOX_SELECTABLE_TYPES } from "./useSmartBoxSelection.types";

export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Rect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

export function detectSelectionMode(
  x1: number,
  _y1: number,
  x2: number,
  _y2: number,
): "window" | "crossing" {
  return x2 >= x1 ? "window" : "crossing";
}

export function calculateSelectedEntities(
  entities: Entity[],
  rect: Rect,
  mode: "window" | "crossing",
  getEntityBBox: (entity: Entity) => ScreenBBox | null,
  isCompletelyInside: (bbox: ScreenBBox, rect: Rect) => boolean,
  isIntersecting: (entity: Entity, rect: Rect, bbox: ScreenBBox | null) => boolean,
  initialSelection: Set<string>,
  shiftKey: boolean,
  ctrlKey: boolean,
): Set<string> {
  const selectedIds = new Set<string>();

  entities.forEach((entity) => {
    const bbox = getEntityBBox(entity);
    if (!bbox) {
      return;
    }

    const isSelected =
      mode === "window"
        ? isCompletelyInside(bbox, rect)
        : isIntersecting(entity, rect, bbox);

    if (isSelected) {
      selectedIds.add(entity.id);
    }
  });

  if (shiftKey || ctrlKey) {
    if (ctrlKey) {
      initialSelection.forEach((id) => {
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
        } else {
          selectedIds.add(id);
        }
      });
    } else {
      initialSelection.forEach((id) => selectedIds.add(id));
    }
  }

  return selectedIds;
}

export function handleEntityClick(
  entityId: string,
  initialSelection: Set<string>,
  shiftKey: boolean,
  ctrlKey: boolean,
): Set<string> {
  const next = new Set(initialSelection);

  if (ctrlKey) {
    if (next.has(entityId)) {
      next.delete(entityId);
    } else {
      next.add(entityId);
    }
    return next;
  }

  if (shiftKey) {
    next.add(entityId);
    return next;
  }

  next.clear();
  next.add(entityId);
  return next;
}

export function getEntityScreenBBox(
  entity: Entity,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): ScreenBBox | null {
  const type = (entity.type || "").toUpperCase();
  if (!BOX_SELECTABLE_TYPES.has(type)) {
    return null;
  }
  if (!entity.geometry) {
    return null;
  }

  const worldBBox = getEntityBBox(entity);
  if (
    !worldBBox ||
    !isFinite(worldBBox.minX) ||
    !isFinite(worldBBox.minY) ||
    !isFinite(worldBBox.maxX) ||
    !isFinite(worldBBox.maxY)
  ) {
    return null;
  }

  const minScreen = worldToScreen(worldBBox.minX, worldBBox.minY);
  const maxScreen = worldToScreen(worldBBox.maxX, worldBBox.maxY);

  return {
    minX: Math.min(minScreen.x, maxScreen.x),
    minY: Math.min(minScreen.y, maxScreen.y),
    maxX: Math.max(minScreen.x, maxScreen.x),
    maxY: Math.max(minScreen.y, maxScreen.y),
  };
}

export function isEntityCompletelyInside(entityBBox: ScreenBBox, rect: Rect): boolean {
  return (
    entityBBox.minX >= rect.x &&
    entityBBox.maxX <= rect.x + rect.width &&
    entityBBox.minY >= rect.y &&
    entityBBox.maxY <= rect.y + rect.height
  );
}
