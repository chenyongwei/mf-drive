import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  EntityClickContext,
  SelectionChangeContext,
} from "../types/CADCanvasTypes";
import { handleEntityClick } from "./useSmartBoxSelection.geometry";
import type {
  DragState,
  Point2D,
  SelectionResult,
} from "./useSmartBoxSelection.types";

interface MouseUpArgs {
  event: MouseEvent;
  dragStateRef: MutableRefObject<DragState>;
  resultRef: MutableRefObject<SelectionResult>;
  containerElement: HTMLElement;
  onSelectionChange: (
    selectedIds: Set<string>,
    context?: SelectionChangeContext,
  ) => void;
  onEntityClick?: (entityId: string, clickContext?: EntityClickContext) => void;
  onEntityDragEnd?: (
    entityId: string,
    endScreenPos: { x: number; y: number },
  ) => void;
  screenToWorld: (screenX: number, screenY: number) => Point2D;
  setResult: Dispatch<SetStateAction<SelectionResult>>;
}

interface MouseDownArgs {
  event: React.MouseEvent;
  dragStateRef: MutableRefObject<DragState>;
  selectedIds: Set<string>;
  screenToWorld: (screenX: number, screenY: number) => Point2D;
  findEntityAtPosition?: (x: number, y: number) => string | null;
}

export function createInitialDragState(): DragState {
  return {
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    initialSelection: new Set(),
    mouseDownEntityId: null,
    mouseDownTime: 0,
    isEntityDragging: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    mouseDownScreenPos: null,
    mouseDownWorldPos: null,
  };
}

export function handleSmartSelectionMouseUp({
  event,
  dragStateRef,
  resultRef,
  containerElement,
  onSelectionChange,
  onEntityClick,
  onEntityDragEnd,
  screenToWorld,
  setResult,
}: MouseUpArgs): void {
  const state = dragStateRef.current;
  if (!state.mouseDownTime) {
    return;
  }

  const rect = containerElement.getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;
  const dist = Math.hypot(screenX - state.startPos.x, screenY - state.startPos.y);

  if (!state.isDragging && dist < 5) {
    const shiftKey = state.shiftKey || event.shiftKey;
    const ctrlKey = state.ctrlKey || event.ctrlKey;

    if (state.mouseDownEntityId) {
      const newSelection = handleEntityClick(
        state.mouseDownEntityId,
        state.initialSelection,
        shiftKey,
        ctrlKey,
      );

      setResult((prev) => ({
        ...prev,
        selectedEntityIds: newSelection,
        selectionCount: newSelection.size,
      }));

      onSelectionChange(newSelection, { source: "click" });
      if (!shiftKey && !ctrlKey) {
        const fallbackWorld = screenToWorld(screenX, screenY);
        const worldPoint = state.mouseDownWorldPos ?? fallbackWorld;
        const screenPoint = state.mouseDownScreenPos ?? {
          x: screenX,
          y: screenY,
        };
        if (worldPoint) {
          onEntityClick?.(state.mouseDownEntityId, {
            entityId: state.mouseDownEntityId,
            worldPoint,
            screenPoint,
            modifiers: {
              shiftKey,
              ctrlKey,
              metaKey: state.metaKey || event.metaKey,
              altKey: state.altKey || event.altKey,
            },
          });
        } else {
          onEntityClick?.(state.mouseDownEntityId);
        }
      }
    } else {
      const newSelection = new Set<string>();
      setResult((prev) => ({
        ...prev,
        selectedEntityIds: newSelection,
        selectionCount: 0,
      }));
      onSelectionChange(newSelection, { source: "click" });
    }
  } else if (state.isEntityDragging && state.mouseDownEntityId) {
    onEntityDragEnd?.(state.mouseDownEntityId, { x: screenX, y: screenY });
  } else if (resultRef.current.isSelecting) {
    onSelectionChange(resultRef.current.selectedEntityIds, { source: "box" });
  }

  dragStateRef.current = createInitialDragState();

  setResult((prev) => ({
    ...prev,
    isSelecting: false,
    currentRect: null,
    selectionMode: null,
  }));
}

export function handleSmartSelectionMouseDown({
  event,
  dragStateRef,
  selectedIds,
  screenToWorld,
  findEntityAtPosition,
}: MouseDownArgs): void {
  if (event.button !== 0) {
    return;
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;

  const worldPos = screenToWorld(screenX, screenY);
  const clickedEntityId = findEntityAtPosition
    ? findEntityAtPosition(worldPos.x, worldPos.y)
    : null;

  dragStateRef.current = {
    isDragging: false,
    startPos: { x: screenX, y: screenY },
    currentPos: { x: screenX, y: screenY },
    initialSelection: new Set(selectedIds),
    mouseDownEntityId: clickedEntityId,
    mouseDownTime: Date.now(),
    isEntityDragging: false,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    mouseDownScreenPos: { x: screenX, y: screenY },
    mouseDownWorldPos: worldPos,
  };
}
