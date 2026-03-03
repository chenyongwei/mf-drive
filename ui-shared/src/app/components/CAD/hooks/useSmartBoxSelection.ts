/**
 * Smart Box Selection Hook
 *
 * Implements intelligent CAD-style box selection with automatic mode detection:
 * - Click on entity -> Single selection
 * - Drag on empty space -> Pan
 * - Shift + Drag -> Box selection (always available)
 * - Quick selection: Click empty with minimal movement = small box selection
 */

import { useRef, useState, useCallback, useEffect } from "react";
import {
  getEntityScreenBBox,
  isEntityCompletelyInside,
  isEntityIntersecting,
} from "./useSmartBoxSelection.geometry";
import {
  createInitialDragState,
  handleSmartSelectionMouseDown,
  handleSmartSelectionMouseMove,
  handleSmartSelectionMouseUp,
} from "./useSmartBoxSelection.handlers";
import type {
  SelectionResult,
  UseSmartBoxSelectionProps,
} from "./useSmartBoxSelection.types";

export const useSmartBoxSelection = ({
  entities,
  viewport,
  onSelectionChange,
  selectedEntityIds = [],
  onEntityClick,
  findEntityAtPosition,
  onEntityDragStart,
  onEntityDrag,
  onEntityDragEnd,
  onEntityDragCancel,
  containerRef,
}: UseSmartBoxSelectionProps) => {
  const [result, setResult] = useState<SelectionResult>({
    isSelecting: false,
    currentRect: null,
    selectionMode: null,
    selectedEntityIds: new Set(selectedEntityIds),
    selectionCount: 0,
  });

  const resultRef = useRef(result);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const dragStateRef = useRef(createInitialDragState());

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => ({
      x: worldX * viewport.zoom + viewport.pan.x,
      y: worldY * viewport.zoom + viewport.pan.y,
    }),
    [viewport.zoom, viewport.pan.x, viewport.pan.y],
  );

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => ({
      x: (screenX - viewport.pan.x) / viewport.zoom,
      y: (screenY - viewport.pan.y) / viewport.zoom,
    }),
    [viewport.zoom, viewport.pan.x, viewport.pan.y],
  );

  const getEntityScreenBBoxCallback = useCallback(
    (entity: Parameters<typeof getEntityScreenBBox>[0]) =>
      getEntityScreenBBox(entity, worldToScreen),
    [worldToScreen],
  );

  const isEntityIntersectingCallback = useCallback(
    (
      entity: Parameters<typeof isEntityIntersecting>[0],
      rect: Parameters<typeof isEntityIntersecting>[1],
      bbox: Parameters<typeof isEntityIntersecting>[2],
    ) => isEntityIntersecting(entity, rect, bbox, worldToScreen),
    [worldToScreen],
  );

  const handleWindowMouseUp = useCallback(
    (event: MouseEvent) => {
      handleSmartSelectionMouseUp({
        event,
        dragStateRef,
        resultRef,
        containerElement: containerRef?.current || document.body,
        onSelectionChange,
        onEntityClick,
        onEntityDragEnd,
        screenToWorld,
        setResult,
      });
    },
    [
      containerRef,
      onSelectionChange,
      onEntityClick,
      onEntityDragEnd,
      screenToWorld,
    ],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [handleWindowMouseUp]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      handleSmartSelectionMouseDown({
        event,
        dragStateRef,
        selectedIds: result.selectedEntityIds,
        screenToWorld,
        findEntityAtPosition,
      });
      window.addEventListener("mouseup", handleWindowMouseUp, { once: true });
    },
    [
      result.selectedEntityIds,
      screenToWorld,
      findEntityAtPosition,
      handleWindowMouseUp,
    ],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      handleSmartSelectionMouseMove({
        event,
        dragStateRef,
        resultRef,
        entities,
        isSelecting: result.isSelecting,
        getEntityScreenBBox: getEntityScreenBBoxCallback,
        isEntityCompletelyInside,
        isEntityIntersecting: isEntityIntersectingCallback,
        onEntityDragStart,
        onEntityDrag,
        setResult,
      });
    },
    [
      entities,
      result.isSelecting,
      getEntityScreenBBoxCallback,
      isEntityIntersectingCallback,
      onEntityDragStart,
      onEntityDrag,
    ],
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent) => {
      handleSmartSelectionMouseUp({
        event: event.nativeEvent,
        dragStateRef,
        resultRef,
        containerElement: containerRef?.current || document.body,
        onSelectionChange,
        onEntityClick,
        onEntityDragEnd,
        screenToWorld,
        setResult,
      });
    },
    [
      containerRef,
      onSelectionChange,
      onEntityClick,
      onEntityDragEnd,
      screenToWorld,
    ],
  );
  const handleMouseLeave = useCallback(() => {}, []);

  return {
    ...result,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
};
