/**
 * CAD-Style Box Selection Hook
 *
 * Implements professional CAD box selection behavior:
 * - Left to right drag: selects entities completely inside (Window selection)
 * - Right to left drag: selects entities intersecting box (Crossing selection)
 * - Shift + drag: add to current selection
 * - Ctrl + drag: remove from current selection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  calculateSelectionRect,
  getSelectedEntities,
} from './useCADBoxSelection.selection';
import type {
  BoxSelectionState,
  Point,
  SelectionMode,
  SelectionRect,
  UseCADBoxSelectionOptions,
} from './useCADBoxSelection.types';

export type {
  Point,
  SelectionRect,
  SelectionMode,
  ModifierKey,
  BoxSelectionState,
  UseCADBoxSelectionOptions,
} from './useCADBoxSelection.types';

export const useCADBoxSelection = (options: UseCADBoxSelectionOptions) => {
  const { entities, onSelectionChange, externalSelectedIds } = options;

  const [state, setState] = useState<BoxSelectionState>({
    isSelecting: false,
    startPoint: null,
    currentPoint: null,
    selectionMode: 'window',
    modifierKey: 'none',
    selectedEntities: new Set(),
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync external selection back to local state
  useEffect(() => {
    if (externalSelectedIds) {
      const extIds = externalSelectedIds; // Capture for closure and type safety
      setState(prev => {
        // Only update if they actually differ to avoid unnecessary renders
        if (prev.selectedEntities.size === extIds.size &&
          Array.from(prev.selectedEntities).every(id => extIds.has(id))) {
          return prev;
        }
        return {
          ...prev,
          selectedEntities: new Set(extIds),
        };
      });
    }
  }, [externalSelectedIds]);

  const computeSelectedEntities = useCallback(
    (rect: SelectionRect, mode: SelectionMode): Set<string> => {
      return getSelectedEntities(entities, rect, mode);
    },
    [entities]
  );

  // Handle mouse down - start box selection
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only start box selection if:
    // 1. Left mouse button
    // 2. Space key is NOT pressed (space is for pan)
    // 3. Not clicking on an entity (handled by entity click handler)
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setState(prev => ({
      ...prev,
      isSelecting: true,
      startPoint,
      currentPoint: startPoint,
      modifierKey: e.shiftKey ? 'shift' : e.ctrlKey ? 'ctrl' : 'none',
    }));
  }, []);

  // Handle mouse move - update selection rectangle
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.isSelecting) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Determine selection mode based on drag direction
    const isLeftToRight = state.startPoint && currentPoint.x >= state.startPoint.x;
    const selectionMode: SelectionMode = isLeftToRight ? 'window' : 'crossing';

    setState(prev => ({
      ...prev,
      currentPoint,
      selectionMode,
    }));
  }, [state.isSelecting, state.startPoint]);

  // Handle mouse up - finalize selection
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.isSelecting || !state.startPoint || !state.currentPoint) {
      setState(prev => ({ ...prev, isSelecting: false }));
      return;
    }

    const selectionRect = calculateSelectionRect(state.startPoint, state.currentPoint);

    // Ignore very small selections (accidental clicks)
    const rectWidth = selectionRect.maxX - selectionRect.minX;
    const rectHeight = selectionRect.maxY - selectionRect.minY;

    if (rectWidth < 5 && rectHeight < 5) {
      setState(prev => ({ ...prev, isSelecting: false, startPoint: null, currentPoint: null }));
      return;
    }

    // Get selected entities based on mode
    const newlySelected = computeSelectedEntities(selectionRect, state.selectionMode);

    // Apply based on modifier key
    let finalSelection: Set<string>;

    if (state.modifierKey === 'shift') {
      // Add to current selection
      finalSelection = new Set([...state.selectedEntities, ...newlySelected]);
    } else if (state.modifierKey === 'ctrl') {
      // Remove from current selection
      finalSelection = new Set([...state.selectedEntities].filter(id => !newlySelected.has(id)));
    } else {
      // Replace selection
      finalSelection = newlySelected;
    }

    setState({
      isSelecting: false,
      startPoint: null,
      currentPoint: null,
      selectionMode: 'window',
      modifierKey: 'none',
      selectedEntities: finalSelection,
    });

    // Notify parent
    if (onSelectionChange) {
      onSelectionChange(finalSelection);
    }
  }, [state, computeSelectedEntities, onSelectionChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedEntities: new Set(),
    }));
    if (onSelectionChange) {
      onSelectionChange(new Set());
    }
  }, [onSelectionChange]);

  // Set selection programmatically
  const setSelection = useCallback((selectedIds: Set<string>) => {
    setState(prev => ({
      ...prev,
      selectedEntities: selectedIds,
    }));
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [onSelectionChange]);

  // Get current selection rectangle for rendering
  const getCurrentRect = useCallback((): SelectionRect | null => {
    if (!state.isSelecting || !state.startPoint || !state.currentPoint) {
      return null;
    }
    return calculateSelectionRect(state.startPoint, state.currentPoint);
  }, [state.isSelecting, state.startPoint, state.currentPoint, calculateSelectionRect]);

  return {
    // State
    isSelecting: state.isSelecting,
    startPoint: state.startPoint,
    currentPoint: state.currentPoint,
    selectionMode: state.selectionMode,
    modifierKey: state.modifierKey,
    selectedEntities: state.selectedEntities,
    currentRect: getCurrentRect(),

    // Ref
    canvasRef,

    // Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    // Actions
    clearSelection,
    setSelection,
  };
};
