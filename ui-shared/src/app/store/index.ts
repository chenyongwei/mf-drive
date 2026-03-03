import { create } from 'zustand';
import type {
  FileInfo,
  ViewState,
  SelectionState,
  OptimizationRules,
  OptimizationPreview,
  ProcessType,
  BoundingBox,
  Layout,
} from '@dxf-fix/shared';

// Export new domain stores for incremental migration
// These replace the monolithic useAppStore over time
export * from './domain';

export interface LayerInfo {
  name: string;
  color: number;
  entityCount: number;
  entities: string[];
}

export interface LayerGroup {
  key: string;
  type: 'color' | 'name';
  label: string;
  layers: LayerInfo[];
}

export interface LayerMapping {
  layerName: string;
  processType: ProcessType;
}

interface AppStore {
  // 文件状态
  files: Map<string, FileInfo>;
  activeFileId: string | null;
  activePartId: string | null;
  addFile: (file: FileInfo) => void;
  removeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  setActivePart: (partId: string | null) => void;
  updateFile: (fileId: string, updates: Partial<FileInfo>) => void;
  getActiveFile: () => FileInfo | null;

  // WebCAD视图状态
  view: ViewState;
  setView: (view: Partial<ViewState>) => void;

  // 排样状态
  selectedLayout: Layout | null;
  setSelectedLayout: (layout: Layout | null) => void;
  showNestingView: boolean;
  setShowNestingView: (show: boolean) => void;
  nestingMaterial: { width: number; height: number } | null;
  setNestingMaterial: (material: { width: number; height: number } | null) => void;

  // 选择状态
  selection: SelectionState;
  setSelection: (selection: Partial<SelectionState>) => void;

  // 规则状态
  rules: OptimizationRules;
  setRules: (rules: Partial<OptimizationRules> | OptimizationRules) => void;

  // 优化预览状态
  previewMode: boolean;
  previewData: OptimizationPreview | null;
  setPreviewMode: (mode: boolean) => void;
  setPreviewData: (data: OptimizationPreview | null) => void;

  // 图层状态
  layers: Map<string, LayerInfo[]>;
  layerMappings: Map<string, ProcessType>;
  setLayers: (fileId: string, layers: LayerInfo[]) => void;
  setLayerMapping: (layerName: string, processType: ProcessType) => void;
  setBatchLayerMapping: (layerNames: string[], processType: ProcessType) => void;
  getLayerMapping: (layerName: string) => ProcessType;
  getActiveFileLayers: () => LayerInfo[];
  clearLayerMappings: () => void;
  exportLayerMappings: () => string;
  importLayerMappings: (json: string) => void;

  // 加载状态
  loading: {
    tiles: Set<string>;
    entities: Set<string>;
  };
  setLoadingTile: (tileId: string, loading: boolean) => void;
  setLoadingEntity: (entityId: string, loading: boolean) => void;
}

const defaultRules: OptimizationRules = {
  tolerance: 0.01,
  autoMergeLines: true,
  removeDuplicates: true,
  autoCloseContours: true,
  closeGapThreshold: 0.1,
  layerMappings: [
    {
      layerName: 'CUT',
      processType: 'CUT',
      enabled: true,
    },
    {
      layerName: 'MARK',
      processType: 'MARK',
      enabled: true,
    },
  ],
};

export const useAppStore = create<AppStore>((set, get) => ({
  // 文件状态
  files: new Map(),
  activeFileId: null,
  activePartId: null,
  addFile: (file) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(file.id, file);
      return {
        files: newFiles,
        activeFileId: state.activeFileId || file.id,
      };
    }),
  removeFile: (fileId) =>
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(fileId);
      let newActiveId = state.activeFileId;
      if (newActiveId === fileId) {
        newActiveId = newFiles.size > 0 ? Array.from(newFiles.keys())[0] : null;
      }
      return {
        files: newFiles,
        activeFileId: newActiveId,
      };
    }),
  setActiveFile: (fileId) => set({ activeFileId: fileId }),
  setActivePart: (partId) => set({ activePartId: partId }),
  updateFile: (fileId, updates) =>
    set((state) => {
      const newFiles = new Map(state.files);
      const file = newFiles.get(fileId);
      if (file) {
        newFiles.set(fileId, { ...file, ...updates });
      }
      return { files: newFiles };
    }),
  getActiveFile: () => {
    const { files, activeFileId } = get();
    return activeFileId ? files.get(activeFileId) || null : null;
  },

  // 视图状态
  view: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    viewport: { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 },
  },
  setView: (view) =>
    set((state) => ({ view: { ...state.view, ...view } })),

  // 排样状态
  selectedLayout: null,
  setSelectedLayout: (layout) => set({ selectedLayout: layout }),
  showNestingView: false,
  setShowNestingView: (show) => set({ showNestingView: show }),
  nestingMaterial: null,
  setNestingMaterial: (material) => set({ nestingMaterial: material }),

  // 选择状态
  selection: {
    parts: [],
    entities: [],
  },
  setSelection: (selection) =>
    set((state) => ({ selection: { ...state.selection, ...selection } })),

  // 规则状态
  rules: defaultRules,
  setRules: (rules) =>
    set((state) => ({
      rules: typeof rules === 'object' && 'tolerance' in rules
        ? { ...rules } as OptimizationRules
        : { ...state.rules, ...rules },
    })),

  // 优化预览状态
  previewMode: false,
  previewData: null,
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setPreviewData: (data) => set({ previewData: data }),

  // 图层状态
  layers: new Map(),
  layerMappings: new Map(),
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
  getLayerMapping: (layerName) => {
    const { layerMappings } = get();
    return layerMappings.get(layerName) || 'NONE';
  },
  getActiveFileLayers: () => {
    const { layers, activeFileId } = get();
    return activeFileId ? layers.get(activeFileId) || [] : [];
  },
  clearLayerMappings: () =>
    set({ layerMappings: new Map() }),
  exportLayerMappings: () => {
    const { layerMappings } = get();
    const mappings = Array.from(layerMappings.entries()).map(([layerName, processType]) => ({
      layerName,
      processType,
    }));
    return JSON.stringify(mappings, null, 2);
  },
  importLayerMappings: (json) =>
    set((state) => {
      try {
        const mappings = JSON.parse(json);
        const newMappings = new Map<string, ProcessType>();
        mappings.forEach((m: any) => {
          newMappings.set(m.layerName, m.processType);
        });
        return { layerMappings: newMappings };
      } catch (error) {
        console.error('Failed to import layer mappings:', error);
        return state;
      }
    }),

  // 加载状态
  loading: {
    tiles: new Set(),
    entities: new Set(),
  },
  setLoadingTile: (tileId, loading) =>
    set((state) => {
      const tiles = new Set(state.loading.tiles);
      if (loading) {
        tiles.add(tileId);
      } else {
        tiles.delete(tileId);
      }
      return { loading: { ...state.loading, tiles } };
    }),
  setLoadingEntity: (entityId, loading) =>
    set((state) => {
      const entities = new Set(state.loading.entities);
      if (loading) {
        entities.add(entityId);
      } else {
        entities.delete(entityId);
      }
      return { loading: { ...state.loading, entities } };
    }),
}));
