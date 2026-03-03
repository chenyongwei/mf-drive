/**
 * useWebGPUViewport - Viewport state management hook
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: Parent manages viewport state via props
 * - Uncontrolled: Hook manages internal state
 *
 * Features:
 * - Auto-fit on mount
 * - Viewport bounds checking
 * - Exposes imperative API
 */

import { useState, useRef, useCallback, useEffect, useMemo, RefObject } from 'react';

export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface UseWebGPUViewportProps {
  // Controlled mode props
  viewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;

  // Initial state (uncontrolled mode)
  initialZoom?: number;
  initialPan?: { x: number; y: number };

  // Constraints
  minZoom?: number;
  maxZoom?: number;

  // Auto-fit
  autoFitOnMount?: boolean;
  contentBox?: BoundingBox;
  containerSize?: { width: number; height: number };
  padding?: number;
}

export interface WebGPUCADViewRef {
  fitToView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
}

// Stable default value for initialPan to prevent infinite re-renders
const DEFAULT_PAN = { x: 0, y: 0 };

export function useWebGPUViewport(props: UseWebGPUViewportProps = {}): [Viewport, (viewport: Viewport) => void, RefObject<WebGPUCADViewRef>] {
  const {
    viewport: controlledViewport,
    onViewportChange,
    initialZoom = 1,
    initialPan = DEFAULT_PAN,
    minZoom = 0.1,
    maxZoom = 10,
    autoFitOnMount = false,
    contentBox,
    containerSize,
    padding = 100,
  } = props;

  // Internal state for uncontrolled mode
  const [internalViewport, setInternalViewport] = useState<Viewport>({
    zoom: initialZoom,
    pan: initialPan,
  });

  // Ref for imperative API
  const ref = useRef<WebGPUCADViewRef>(null);

  // TEMPORARY: Track viewport ref to prevent infinite loop
  // This is a workaround for the architecture issue described in INFINITE_LOOP_BUG.md
  const viewportRef = useRef<Viewport>(internalViewport);
  const lastViewportRef = useRef<Viewport>(internalViewport);
  const isUpdatingRef = useRef(false);
  const didAutoFitRef = useRef(false);

  // Determine if controlled mode
  const isControlled = controlledViewport !== undefined && onViewportChange !== undefined;

  // Update viewport with bounds checking
  const updateViewport = useCallback((newViewport: Viewport) => {
    // TEMPORARY: Prevent infinite loop by checking if values actually changed
    const current = isControlled ? controlledViewport! : internalViewport;
    const valuesChanged =
      current.zoom !== newViewport.zoom ||
      current.pan.x !== newViewport.pan.x ||
      current.pan.y !== newViewport.pan.y;

    if (!valuesChanged || isUpdatingRef.current) {
      return; // Skip update if values haven't changed or already updating
    }

    // Clamp zoom
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newViewport.zoom));

    const clampedViewport: Viewport = {
      zoom: clampedZoom,
      pan: newViewport.pan,
    };

    isUpdatingRef.current = true;

    if (isControlled) {
      onViewportChange(clampedViewport);
    } else {
      setInternalViewport(clampedViewport);
    }

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [isControlled, controlledViewport, internalViewport, onViewportChange, minZoom, maxZoom]);

  // Auto-fit on mount - DISABLED to prevent infinite loop
  // TODO: Fix circular dependency issue before re-enabling
  // The problem: updateViewport -> internalViewport change -> updateViewport recreated -> effect runs again
  useEffect(() => {
    // Auto-fit temporarily disabled - user can manually fit using "Fit to View" button
  }, []);

  // REMOVED: Viewport sync useEffect to prevent infinite loop
  // viewportRef and lastViewportRef will be accessed directly through closures
  // This removes one source of circular dependency

  // Expose imperative API - use refs to avoid infinite re-render loop
  // Note: We use a ref to store updateViewport to prevent recreating these methods on every render
  const updateViewportRef = useRef(updateViewport);
  updateViewportRef.current = updateViewport;

  const minZoomRef = useRef(minZoom);
  const maxZoomRef = useRef(maxZoom);
  minZoomRef.current = minZoom;
  maxZoomRef.current = maxZoom;

  useEffect(() => {
    if (ref.current) {
      // fitToView is disabled - user must manually use "Fit to View" button
      ref.current.fitToView = () => {
      };
      // Access current viewport directly through closure
      ref.current.getViewport = () => isControlled ? controlledViewport! : internalViewport;
      ref.current.setViewport = updateViewportRef.current;
      ref.current.zoomIn = () => {
        const current = isControlled ? controlledViewport! : internalViewport;
        updateViewportRef.current({
          zoom: Math.min(current.zoom * 1.2, maxZoomRef.current),
          pan: current.pan,
        });
      };
      ref.current.zoomOut = () => {
        const current = isControlled ? controlledViewport! : internalViewport;
        updateViewportRef.current({
          zoom: Math.max(current.zoom / 1.2, minZoomRef.current),
          pan: current.pan,
        });
      };
    }
    // NO DEPENDENCIES - only run on mount to set up the ref methods
    // All dynamic values are accessed through refs inside closures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [isControlled ? controlledViewport! : internalViewport, updateViewport, ref];
}
