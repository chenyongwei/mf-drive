/**
 * Free Rotation Hook
 *
 * Handles free rotation with angle snapping:
 * - Drag-based rotation
 * - Snap to common angles (0°, 15°, 30°, 45°, 90°)
 * - Real-time collision preview
 * - Visual protractor
 */

import { useState, useCallback } from 'react';
import { Point } from '../types/NestingTypes';

interface UseFreeRotationOptions {
  snapAngles?: number[]; // Angles to snap to (in degrees)
  snapTolerance?: number; // How close to snap angle (in degrees)
  onRotationChange?: (angle: number, snapped: boolean) => void;
  onRotationComplete?: (finalAngle: number) => void;
}

interface RotationDragState {
  isActive: boolean;
  center: Point;
  startAngle: number;
  currentAngle: number;
  snappedAngle: number;
  startMouse: Point;
}

export const useFreeRotation = (options: UseFreeRotationOptions = {}) => {
  const {
    snapAngles = [0, 15, 30, 45, 60, 75, 90, 120, 135, 150, 180],
    snapTolerance = 5, // degrees
    onRotationChange,
    onRotationComplete,
  } = options;

  const [dragState, setDragState] = useState<RotationDragState>({
    isActive: false,
    center: { x: 0, y: 0 },
    startAngle: 0,
    currentAngle: 0,
    snappedAngle: 0,
    startMouse: { x: 0, y: 0 },
  });

  /**
   * Calculate angle from center point to mouse position
   */
  const calculateAngle = useCallback((center: Point, mouse: Point): number => {
    const dx = mouse.x - center.x;
    const dy = mouse.y - center.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return angle;
  }, []);

  /**
   * Normalize angle to 0-360 range
   */
  const normalizeAngle = useCallback((angle: number): number => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }, []);

  /**
   * Find nearest snap angle
   */
  const findSnapAngle = useCallback((angle: number): number => {
    const normalized = normalizeAngle(angle);

    for (const snapAngle of snapAngles) {
      const diff = Math.abs(normalized - snapAngle);
      if (diff < snapTolerance || Math.abs(diff - 360) < snapTolerance) {
        return snapAngle;
      }
    }

    // Check if near 360/0 boundary
    for (const snapAngle of snapAngles) {
      if (snapAngle === 0) continue;
      const diff = Math.abs(normalized - (snapAngle + 360));
      if (diff < snapTolerance) {
        return snapAngle;
      }
    }

    return angle; // No snap
  }, [snapAngles, snapTolerance, normalizeAngle]);

  /**
   * Start rotation drag
   */
  const startRotation = useCallback((center: Point, startMouse: Point, initialAngle: number = 0) => {
    const startAngle = calculateAngle(center, startMouse);

    setDragState({
      isActive: true,
      center,
      startAngle,
      currentAngle: initialAngle,
      snappedAngle: initialAngle,
      startMouse,
    });
  }, [calculateAngle]);

  /**
   * Update rotation during drag
   */
  const updateRotation = useCallback((mouse: Point) => {
    if (!dragState.isActive) return;

    const currentMouseAngle = calculateAngle(dragState.center, mouse);
    const angleDelta = currentMouseAngle - dragState.startAngle;

    const newAngle = normalizeAngle(dragState.currentAngle + angleDelta);
    const snappedAngle = findSnapAngle(newAngle);
    const isSnapped = snappedAngle !== newAngle;

    setDragState(prev => ({
      ...prev,
      currentAngle: newAngle,
      snappedAngle: isSnapped ? snappedAngle : newAngle,
    }));

    onRotationChange?.(isSnapped ? snappedAngle : newAngle, isSnapped);
  }, [dragState.isActive, dragState.center, dragState.startAngle, dragState.currentAngle, calculateAngle, normalizeAngle, findSnapAngle, onRotationChange]);

  /**
   * Complete rotation drag
   */
  const completeRotation = useCallback(() => {
    if (!dragState.isActive) return;

    onRotationComplete?.(dragState.snappedAngle);

    setDragState({
      isActive: false,
      center: { x: 0, y: 0 },
      startAngle: 0,
      currentAngle: 0,
      snappedAngle: 0,
      startMouse: { x: 0, y: 0 },
    });
  }, [dragState.isActive, dragState.snappedAngle, onRotationComplete]);

  /**
   * Cancel rotation drag
   */
  const cancelRotation = useCallback(() => {
    if (!dragState.isActive) return;

    setDragState({
      isActive: false,
      center: { x: 0, y: 0 },
      startAngle: 0,
      currentAngle: 0,
      snappedAngle: 0,
      startMouse: { x: 0, y: 0 },
    });
  }, [dragState.isActive]);

  /**
   * Fine-tune rotation with keyboard (1 degree increments)
   */
  const fineTuneRotation = useCallback((delta: number) => {
    const newAngle = normalizeAngle(dragState.currentAngle + delta);
    const snappedAngle = findSnapAngle(newAngle);

    onRotationChange?.(snappedAngle, snappedAngle !== newAngle);
  }, [dragState.currentAngle, normalizeAngle, findSnapAngle, onRotationChange]);

  return {
    // State
    isActive: dragState.isActive,
    center: dragState.center,
    currentAngle: dragState.currentAngle,
    snappedAngle: dragState.snappedAngle,
    isSnapped: dragState.snappedAngle !== dragState.currentAngle,

    // Actions
    startRotation,
    updateRotation,
    completeRotation,
    cancelRotation,
    fineTuneRotation,

    // Utilities
    calculateAngle,
    normalizeAngle,
    findSnapAngle,
  };
};
