/**
 * ViewportContext - Centralized viewport state management
 *
 * Eliminates circular dependencies by:
 * 1. Providing single source of truth for viewport state
 * 2. Removing prop drilling through multiple component layers
 * 3. Eliminating callback chains that cause loops
 *
 * Usage:
 * ```tsx
 * <ViewportProvider>
 *   <YourComponent />
 * </ViewportProvider>
 *
 * // In component
 * const { viewport, setViewport, fitToView, zoomIn, zoomOut } = useViewport();
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

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

interface ViewportContextValue {
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;
  fitToView: (contentBox: BoundingBox, containerSize: { width: number; height: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getViewport: () => Viewport;
  updateContainerSize: (width: number, height: number) => void;
}

const ViewportContext = createContext<ViewportContextValue | undefined>(undefined);

interface ViewportProviderProps {
  children: ReactNode;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  padding?: number;
}

export const ViewportProvider: React.FC<ViewportProviderProps> = ({
  children,
  initialZoom = 1,
  minZoom = 0.0001,
  maxZoom = 100,
  padding = 100,
}) => {
  // Use refs to prevent circular dependencies
  const isUpdatingRef = useRef(false);
  const viewportRef = useRef<Viewport>({ zoom: initialZoom, pan: { x: 0, y: 0 } });

  // Viewport state - single source of truth
  const [viewport, setViewportState] = useState<Viewport>(() => ({
    zoom: initialZoom,
    pan: { x: 0, y: 0 },
  }));

  // Keep ref in sync with state
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Stable update function with bounds checking (NO viewport dependency!)
  const setViewport = useCallback((newViewport: Viewport) => {
    // Prevent infinite loop by checking if update is in progress
    if (isUpdatingRef.current) {
      return;
    }

    // Get current viewport from ref (not from closure to avoid stale data)
    const currentViewport = viewportRef.current;

    // Check if values actually changed
    const valuesChanged =
      currentViewport.zoom !== newViewport.zoom ||
      currentViewport.pan.x !== newViewport.pan.x ||
      currentViewport.pan.y !== newViewport.pan.y;

    if (!valuesChanged) {
      return;
    }

    // Clamp zoom (only enforce maxZoom, allow unlimited zoom out)
    const clampedZoom = Math.min(maxZoom, newViewport.zoom);

    // Check if clamped values are the same as current (prevents unnecessary re-renders)
    if (currentViewport.zoom === clampedZoom &&
      currentViewport.pan.x === newViewport.pan.x &&
      currentViewport.pan.y === newViewport.pan.y) {
      return; // No actual change after clamping, skip update
    }

    isUpdatingRef.current = true;

    setViewportState({
      zoom: clampedZoom,
      pan: newViewport.pan,
    });

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [minZoom, maxZoom]); // NO viewport dependency!

  // Fit to view function
  const fitToView = useCallback((contentBox: BoundingBox, containerSize: { width: number; height: number }) => {
    console.log('===== ViewportContext FITTOVIEW START =====');
    console.log('[ViewportContext] fitToView called with contentBox:', contentBox, 'containerSize:', containerSize);

    const contentWidth = contentBox.maxX - contentBox.minX;
    const contentHeight = contentBox.maxY - contentBox.minY;

    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;

    // Calculate zoom to fit content
    const zoomX = availableWidth / contentWidth;
    const zoomY = availableHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, maxZoom);

    // Calculate pan to center content
    const newPan = {
      x: padding + (availableWidth - contentWidth * newZoom) / 2 - contentBox.minX * newZoom,
      y: padding + (availableHeight - contentHeight * newZoom) / 2 - contentBox.minY * newZoom,
    };

    console.log('[ViewportContext] fitToView calculated newZoom:', newZoom, 'newPan:', newPan);
    console.log('===== ViewportContext FITTOVIEW END =====');

    setViewport({ zoom: newZoom, pan: newPan });
  }, [padding, maxZoom, setViewport]);

  // Container size ref for zoom centering
  const containerSizeRef = useRef<{ width: number; height: number }>({ width: 800, height: 600 });

  // Update container size ref (can be called from components)
  const updateContainerSize = useCallback((width: number, height: number) => {
    containerSizeRef.current = { width, height };
  }, []);

  // Helper to calculate pan adjustment for centered zoom
  const getZoomCenteredPan = useCallback((currentZoom: number, newZoom: number, currentPan: { x: number; y: number }) => {
    // Get screen center
    const centerX = containerSizeRef.current.width / 2;
    const centerY = containerSizeRef.current.height / 2;
    // Convert screen center to world coordinates
    const worldX = (centerX - currentPan.x) / currentZoom;
    const worldY = (centerY - currentPan.y) / currentZoom;
    // Calculate new pan to keep the same world point at center
    return {
      x: centerX - worldX * newZoom,
      y: centerY - worldY * newZoom,
    };
  }, []);

  // Zoom functions - centered on screen center (current graphic center)
  const zoomIn = useCallback(() => {
    const currentViewport = viewportRef.current;
    const newZoom = Math.min(currentViewport.zoom * 1.2, maxZoom);
    const newPan = getZoomCenteredPan(currentViewport.zoom, newZoom, currentViewport.pan);
    setViewport({ zoom: newZoom, pan: newPan });
  }, [maxZoom, setViewport, getZoomCenteredPan]);

  const zoomOut = useCallback(() => {
    const currentViewport = viewportRef.current;
    const newZoom = currentViewport.zoom / 1.2;
    const newPan = getZoomCenteredPan(currentViewport.zoom, newZoom, currentViewport.pan);
    setViewport({ zoom: newZoom, pan: newPan });
  }, [setViewport, getZoomCenteredPan]);

  // Get current viewport (for imperative API)
  const getViewport = useCallback(() => viewport, [viewport]);

  const value: ViewportContextValue = {
    viewport,
    setViewport,
    fitToView,
    zoomIn,
    zoomOut,
    getViewport,
    updateContainerSize,
  };

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = (): ViewportContextValue => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
};
