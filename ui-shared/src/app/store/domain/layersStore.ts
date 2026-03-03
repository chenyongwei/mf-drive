/**
 * Layer State Management
 *
 * Handles layer information, mappings, and process type assignments.
 */

import { create } from "zustand";
import type { ProcessType } from "@dxf-fix/shared";

export interface LayerInfo {
  name: string;
  color: number;
  entityCount: number;
  entities: string[];
}

export interface LayersState {
  // State
  layers: Map<string, LayerInfo[]>;
  layerMappings: Map<string, ProcessType>;

  // Actions
  setLayers: (fileId: string, layers: LayerInfo[]) => void;
  setLayerMapping: (layerName: string, processType: ProcessType) => void;
  setBatchLayerMapping: (
    layerNames: string[],
    processType: ProcessType,
  ) => void;
  removeLayerMapping: (layerName: string) => void;
  clearLayerMappings: () => void;

  // Getters
  getLayerMapping: (layerName: string) => ProcessType;
  getFileLayers: (fileId: string) => LayerInfo[];
  exportLayerMappings: () => string;
  importLayerMappings: (json: string) => boolean;
}

const DEFAULT_MAPPINGS: Record<string, ProcessType> = {
  CUT: "CUT",
  MARK: "MARK",
};

export const useLayersStore = create<LayersState>((set, get) => ({
  // Initial state
  layers: new Map(),
  layerMappings: new Map(Object.entries(DEFAULT_MAPPINGS)),

  // Actions
  setLayers: (fileId, layers) =>
    set((state) => {
      const newLayers = new Map(state.layers);
      newLayers.set(fileId, layers);
      return { layers: newLayers };
    }),

  setLayerMapping: (layerName, processType) =>
    set((state) => {
      const newMappings = new Map(state.layerMappings);
      newMappings.set(layerName, processType);
      return { layerMappings: newMappings };
    }),

  setBatchLayerMapping: (layerNames, processType) =>
    set((state) => {
      const newMappings = new Map(state.layerMappings);
      layerNames.forEach((layerName) => {
        newMappings.set(layerName, processType);
      });
      return { layerMappings: newMappings };
    }),

  removeLayerMapping: (layerName) =>
    set((state) => {
      const newMappings = new Map(state.layerMappings);
      newMappings.delete(layerName);
      return { layerMappings: newMappings };
    }),

  clearLayerMappings: () =>
    set({
      layerMappings: new Map(Object.entries(DEFAULT_MAPPINGS)),
    }),

  // Getters
  getLayerMapping: (layerName) => {
    const { layerMappings } = get();
    return layerMappings.get(layerName) || "NONE";
  },

  getFileLayers: (fileId) => {
    const { layers } = get();
    return layers.get(fileId) || [];
  },

  exportLayerMappings: () => {
    const { layerMappings } = get();
    const mappings = Array.from(layerMappings.entries()).map(
      ([layerName, processType]) => ({
        layerName,
        processType,
      }),
    );
    return JSON.stringify(mappings, null, 2);
  },

  importLayerMappings: (json) => {
    try {
      const mappings = JSON.parse(json);
      const newMappings = new Map<string, ProcessType>();
      mappings.forEach((m: { layerName: string; processType: ProcessType }) => {
        newMappings.set(m.layerName, m.processType);
      });
      set({ layerMappings: newMappings });
      return true;
    } catch (error) {
      console.error("Failed to import layer mappings:", error);
      return false;
    }
  },
}));
