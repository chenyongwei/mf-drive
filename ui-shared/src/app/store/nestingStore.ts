import { create } from 'zustand';
import {
  NestingProgress,
  Layout,
  PlacedPart,
  PrtsPartSummary,
} from '@dxf-fix/shared';

/**
 * 排样状态
 */
type NestingStatus = 'idle' | 'loading' | 'running' | 'completed' | 'stopped' | 'error';

interface NestingState {
  // 零件数据
  allParts: PrtsPartSummary[];
  selectedParts: PrtsPartSummary[];

  // 排样任务
  nestingId: string | null;
  status: NestingStatus;
  progress: NestingProgress | null;
  result: Layout | null;

  // 板材设置
  material: {
    width: number;
    height: number;
    autoGenerate: boolean;
  };

  // 错误信息
  error: string | null;

  // Actions
  setAllParts: (parts: PrtsPartSummary[]) => void;
  setSelectedParts: (parts: PrtsPartSummary[]) => void;
  addSelectedPart: (part: PrtsPartSummary) => void;
  removeSelectedPart: (partId: string) => void;
  clearSelectedParts: () => void;

  setNestingId: (id: string | null) => void;
  setStatus: (status: NestingStatus) => void;
  setProgress: (progress: NestingProgress | null) => void;
  setResult: (result: Layout | null) => void;
  setError: (error: string | null) => void;

  setMaterial: (material: { width: number; height: number; autoGenerate: boolean }) => void;

  reset: () => void;
}

const initialState = {
  allParts: [],
  selectedParts: [],
  nestingId: null,
  status: 'idle' as NestingStatus,
  progress: null,
  result: null,
  material: {
    width: 6000,
    height: 2000,
    autoGenerate: true,
  },
  error: null,
};

export const useNestingStore = create<NestingState>((set) => ({
  ...initialState,

  setAllParts: (parts) => set({ allParts: parts }),

  setSelectedParts: (parts) => set({ selectedParts: parts }),

  addSelectedPart: (part) =>
    set((state) => ({
      selectedParts: state.selectedParts.some((p) => p.partId === part.partId)
        ? state.selectedParts
        : [...state.selectedParts, part],
    })),

  removeSelectedPart: (partId) =>
    set((state) => ({
      selectedParts: state.selectedParts.filter((p) => p.partId !== partId),
    })),

  clearSelectedParts: () => set({ selectedParts: [] }),

  setNestingId: (id) => set({ nestingId: id }),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress }),

  setResult: (result) => set({ result }),

  setError: (error) => set({ error }),

  setMaterial: (material) => set({ material }),

  reset: () => set(initialState),
}));
