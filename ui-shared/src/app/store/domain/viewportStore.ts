/**
 * Viewport State Management
 *
 * Handles zoom, pan, and viewport bounds for CAD views.
 * This replaces the ViewportContext and consolidates viewport state.
 */

import { create } from "zustand";
import type { ViewState, BoundingBox } from "@dxf-fix/shared";

export interface ViewportState extends ViewState {
  // Derived state
  containerSize: { width: number; height: number };

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setViewport: (viewport: Partial<ViewState>) => void;
  setContainerSize: (size: { width: number; height: number }) => void;
  fitToContent: (bbox: BoundingBox, padding?: number) => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  resetView: () => void;
  centerOn: (point: { x: number; y: number }) => void;
}

const DEFAULT_VIEW: ViewState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewport: { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 },
};

const ZOOM_LIMITS = { min: 0.1, max: 50 };

export const useViewportStore = create<ViewportState>((set, get) => ({
  // Initial state
  ...DEFAULT_VIEW,
  containerSize: { width: 1000, height: 800 },

  setZoom: (zoom) =>
    set((state) => ({
      zoom: Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom)),
    })),

  setPan: (pan) =>
    set((state) => ({
      pan,
    })),

  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  setContainerSize: (containerSize) => set({ containerSize }),

  fitToContent: (bbox, padding = 50) => {
    const state = get();
    const { width, height } = state.containerSize;

    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;

    if (contentWidth === 0 || contentHeight === 0) {
      return;
    }

    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const zoomX = availableWidth / contentWidth;
    const zoomY = availableHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, ZOOM_LIMITS.max);

    const centerX = (bbox.minX + bbox.maxX) / 2;
    const centerY = (bbox.minY + bbox.maxY) / 2;

    const newPan = {
      x: width / 2 - centerX * newZoom,
      y: height / 2 - centerY * newZoom,
    };

    set({
      zoom: newZoom,
      pan: newPan,
      viewport: bbox,
    });
  },

  zoomIn: (factor = 1.2) =>
    set((state) => ({
      zoom: Math.min(ZOOM_LIMITS.max, state.zoom * factor),
    })),

  zoomOut: (factor = 1.2) =>
    set((state) => ({
      zoom: Math.max(ZOOM_LIMITS.min, state.zoom / factor),
    })),

  resetView: () =>
    set({
      ...DEFAULT_VIEW,
    }),

  centerOn: (point) =>
    set((state) => {
      const { width, height } = state.containerSize;
      return {
        pan: {
          x: width / 2 - point.x * state.zoom,
          y: height / 2 - point.y * state.zoom,
        },
      };
    }),
}));
