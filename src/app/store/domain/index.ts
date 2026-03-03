/**
 * Domain Stores
 *
 * Exports all domain-specific Zustand stores for the CAD application.
 * Each store manages a specific domain of state, following the
 * single-responsibility principle.
 */

export { useViewportStore } from './viewportStore';
export { useFilesStore } from './filesStore';
export { useSelectionStore } from './selectionStore';
export { useLayersStore } from './layersStore';

// Re-export types for convenience
export type { ViewportState } from './viewportStore';
export type { FilesState } from './filesStore';
export type { SelectionStateExtended } from './selectionStore';
export type { LayersState } from './layersStore';
export type { LayerInfo } from './layersStore';
