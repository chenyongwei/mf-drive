/**
 * Multi-Select Parts Hook
 *
 * Manages selection of multiple parts for group operations:
 * - Toggle selection with Ctrl/Cmd+click
 * - Box selection for multiple parts
 * - Clear selection
 * - Select all parts in a plate
 */

import { useState, useCallback, useMemo } from 'react';
import { NestingPart, Point, BoundingBox } from '../types/NestingTypes';

interface UseMultiSelectPartsOptions {
  parts: NestingPart[];
  selectedPartIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const useMultiSelectParts = (options: UseMultiSelectPartsOptions) => {
  const { parts, selectedPartIds: controlledSelectedPartIds, onSelectionChange } = options;

  const [internalSelectedPartIds, setInternalSelectedPartIds] = useState<string[]>([]);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<Point | null>(null);
  const [boxSelectionEnd, setBoxSelectionEnd] = useState<Point | null>(null);
  const isControlled = Array.isArray(controlledSelectedPartIds);
  const selectedPartIds = isControlled
    ? controlledSelectedPartIds
    : internalSelectedPartIds;

  const applySelection = useCallback(
    (nextSelection: string[]) => {
      if (!isControlled) {
        setInternalSelectedPartIds(nextSelection);
      }
      onSelectionChange?.(nextSelection);
    },
    [isControlled, onSelectionChange],
  );

  /**
   * Toggle selection of a single part
   */
  const togglePartSelection = useCallback((partId: string, isCtrlPressed: boolean = false) => {
    const computeNextSelection = (baseSelection: string[]) => {
      if (!isCtrlPressed) {
        return [partId];
      }
      if (baseSelection.includes(partId)) {
        return baseSelection.filter(id => id !== partId);
      }
      return [...baseSelection, partId];
    };

    if (isControlled) {
      applySelection(computeNextSelection(selectedPartIds));
      return;
    }

    setInternalSelectedPartIds((prev) => {
      const nextSelection = computeNextSelection(prev);
      onSelectionChange?.(nextSelection);
      return nextSelection;
    });
  }, [applySelection, isControlled, onSelectionChange, selectedPartIds]);

  /**
   * Set selection to specific parts
   */
  const setSelection = useCallback((partIds: string[]) => {
    applySelection(partIds);
  }, [applySelection]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    applySelection([]);
  }, [applySelection]);

  /**
   * Select all parts
   */
  const selectAll = useCallback(() => {
    const allIds = parts.map(p => p.id);
    applySelection(allIds);
  }, [parts, applySelection]);

  /**
   * Start box selection
   */
  const startBoxSelection = useCallback((startPoint: Point) => {
    setIsBoxSelecting(true);
    setBoxSelectionStart(startPoint);
    setBoxSelectionEnd(startPoint);
    applySelection([]);
  }, [applySelection]);

  /**
   * Update box selection end point
   */
  const updateBoxSelection = useCallback((endPoint: Point) => {
    setBoxSelectionEnd(endPoint);
  }, []);

  /**
   * Complete box selection and select parts within the box
   */
  const completeBoxSelection = useCallback(() => {
    if (!boxSelectionStart || !boxSelectionEnd) {
      setIsBoxSelecting(false);
      return;
    }

    // Calculate bounding box of selection rectangle
    const minX = Math.min(boxSelectionStart.x, boxSelectionEnd.x);
    const maxX = Math.max(boxSelectionStart.x, boxSelectionEnd.x);
    const minY = Math.min(boxSelectionStart.y, boxSelectionEnd.y);
    const maxY = Math.max(boxSelectionStart.y, boxSelectionEnd.y);

    // Find all parts that intersect with the selection box
    const selectedIds: string[] = [];

    for (const part of parts) {
      // Check if part's bounding box intersects with selection box
      const bbox = part.boundingBox;
      const partMinX = part.position.x + bbox.minX;
      const partMaxX = part.position.x + bbox.maxX;
      const partMinY = part.position.y + bbox.minY;
      const partMaxY = part.position.y + bbox.maxY;

      // Check for intersection
      if (partMaxX >= minX && partMinX <= maxX && partMaxY >= minY && partMinY <= maxY) {
        selectedIds.push(part.id);
      }
    }

    applySelection(selectedIds);

    setIsBoxSelecting(false);
    setBoxSelectionStart(null);
    setBoxSelectionEnd(null);
  }, [boxSelectionStart, boxSelectionEnd, parts, applySelection]);

  /**
   * Cancel box selection
   */
  const cancelBoxSelection = useCallback(() => {
    setIsBoxSelecting(false);
    setBoxSelectionStart(null);
    setBoxSelectionEnd(null);
  }, []);

  // Get selected parts
  const selectedParts = useMemo(() => {
    return parts.filter(p => selectedPartIds.includes(p.id));
  }, [parts, selectedPartIds]);

  // Calculate centroid of selected parts (for group rotation)
  const selectionCentroid = useMemo(() => {
    if (selectedParts.length === 0) return null;

    let sumX = 0;
    let sumY = 0;

    for (const part of selectedParts) {
      const bbox = part.boundingBox;
      const centerX = part.position.x + (bbox.minX + bbox.maxX) / 2;
      const centerY = part.position.y + (bbox.minY + bbox.maxY) / 2;
      sumX += centerX;
      sumY += centerY;
    }

    return {
      x: sumX / selectedParts.length,
      y: sumY / selectedParts.length,
    };
  }, [selectedParts]);

  // Calculate bounding box of all selected parts
  const selectionBoundingBox = useMemo(() => {
    if (selectedParts.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const part of selectedParts) {
      const bbox = part.boundingBox;
      const partMinX = part.position.x + bbox.minX;
      const partMaxX = part.position.x + bbox.maxX;
      const partMinY = part.position.y + bbox.minY;
      const partMaxY = part.position.y + bbox.maxY;

      minX = Math.min(minX, partMinX);
      maxX = Math.max(maxX, partMaxX);
      minY = Math.min(minY, partMinY);
      maxY = Math.max(maxY, partMaxY);
    }

    return { minX, maxX, minY, maxY };
  }, [selectedParts]);

  return {
    // State
    selectedPartIds,
    selectedParts,
    isBoxSelecting,
    boxSelectionStart,
    boxSelectionEnd,
    selectionCentroid,
    selectionBoundingBox,

    // Actions
    togglePartSelection,
    setSelection,
    clearSelection,
    selectAll,

    // Box selection
    startBoxSelection,
    updateBoxSelection,
    completeBoxSelection,
    cancelBoxSelection,
  };
};
