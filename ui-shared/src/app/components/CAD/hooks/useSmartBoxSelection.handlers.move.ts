import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import {
  calculateSelectedEntities,
  detectSelectionMode,
  normalizeRect,
} from "./useSmartBoxSelection.geometry";
import type {
  DragState,
  Rect,
  ScreenBBox,
  SelectionResult,
} from "./useSmartBoxSelection.types";

interface MouseMoveArgs {
  event: React.MouseEvent;
  dragStateRef: MutableRefObject<DragState>;
  resultRef: MutableRefObject<SelectionResult>;
  entities: Entity[];
  isSelecting: boolean;
  getEntityScreenBBox: (entity: Entity) => ScreenBBox | null;
  isEntityCompletelyInside: (bbox: ScreenBBox, rect: Rect) => boolean;
  isEntityIntersecting: (entity: Entity, rect: Rect, bbox: ScreenBBox | null) => boolean;
  onEntityDragStart?: (
    entityId: string,
    startScreenPos: { x: number; y: number },
  ) => void;
  onEntityDrag?: (
    entityId: string,
    currentScreenPos: { x: number; y: number },
    delta: { x: number; y: number },
  ) => void;
  setResult: Dispatch<SetStateAction<SelectionResult>>;
}

export function handleSmartSelectionMouseMove({
  event,
  dragStateRef,
  resultRef,
  entities,
  isSelecting,
  getEntityScreenBBox,
  isEntityCompletelyInside,
  isEntityIntersecting,
  onEntityDragStart,
  onEntityDrag,
  setResult,
}: MouseMoveArgs): void {
  const state = dragStateRef.current;
  if (!state.mouseDownTime) {
    return;
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;
  const dist = Math.hypot(screenX - state.startPos.x, screenY - state.startPos.y);

  if (dist < 5 && !state.isDragging) {
    return;
  }

  if (!state.isDragging) {
    state.isDragging = true;

    if (event.shiftKey || !state.mouseDownEntityId) {
      const selectionRect = normalizeRect(
        state.startPos.x,
        state.startPos.y,
        screenX,
        screenY,
      );
      const mode = detectSelectionMode(
        state.startPos.x,
        state.startPos.y,
        screenX,
        screenY,
      );

      setResult((prev) => ({
        ...prev,
        isSelecting: true,
        currentRect: selectionRect,
        selectionMode: mode,
      }));
      resultRef.current = {
        ...resultRef.current,
        isSelecting: true,
        currentRect: selectionRect,
        selectionMode: mode,
      };
    } else {
      state.isEntityDragging = true;
      onEntityDragStart?.(state.mouseDownEntityId, {
        x: state.startPos.x,
        y: state.startPos.y,
      });
      return;
    }
  }

  state.currentPos = { x: screenX, y: screenY };

  if (state.isEntityDragging && state.mouseDownEntityId) {
    onEntityDrag?.(
      state.mouseDownEntityId,
      { x: screenX, y: screenY },
      { x: screenX - state.startPos.x, y: screenY - state.startPos.y },
    );
    return;
  }

  const selectionRect = normalizeRect(
    state.startPos.x,
    state.startPos.y,
    screenX,
    screenY,
  );
  const mode = detectSelectionMode(
    state.startPos.x,
    state.startPos.y,
    screenX,
    screenY,
  );

  const selectedIds = calculateSelectedEntities(
    entities,
    selectionRect,
    mode,
    getEntityScreenBBox,
    isEntityCompletelyInside,
    isEntityIntersecting,
    state.initialSelection,
    event.shiftKey,
    event.ctrlKey,
  );

  setResult((prev) => ({
    ...prev,
    currentRect: selectionRect,
    selectionMode: mode,
    selectedEntityIds: selectedIds,
    selectionCount: selectedIds.size,
  }));
  resultRef.current = {
    ...resultRef.current,
    isSelecting: true,
    currentRect: selectionRect,
    selectionMode: mode,
    selectedEntityIds: selectedIds,
    selectionCount: selectedIds.size,
  };
}
