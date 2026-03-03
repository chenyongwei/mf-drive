/**
 * WebGPUCADView - Unified WebGPU CAD View Component Library
 *
 * Exports all components and hooks for easy importing
 */

// Main component
export { default as WebGPUCADView } from './WebGPUCADView.tsx';
export type {
  WebGPUCADViewProps,
  WebGPUCADViewRef,
  Viewport,
  BoundingBox,
  InspectionMarker,
  PartFillData,
} from './WebGPUCADView.tsx';

// UI Components
export { default as WebGPURuler } from './WebGPURuler.tsx';
export type { ZoomControlsPosition } from './WebGPUZoomControls.tsx';

export { default as WebGPUZoomControls } from './WebGPUZoomControls.tsx';

export { default as WebGPUFPSDisplay } from './WebGPUFPSDisplay.tsx';
export type { FPSDisplayPosition } from './WebGPUFPSDisplay.tsx';

// Hooks
export { useWebGPUViewport } from './hooks/useWebGPUViewport.ts';
export type {
  UseWebGPUViewportProps,
} from './hooks/useWebGPUViewport.ts';

export { useWebGPUZoom } from './hooks/useWebGPUZoom.ts';
export type {
  UseWebGPUZoomProps,
} from './hooks/useWebGPUZoom.ts';

export { useWebGPUPan } from './hooks/useWebGPUPan.ts';
export type {
  UseWebGPUPanProps,
  Bounds,
} from './hooks/useWebGPUPan.ts';
