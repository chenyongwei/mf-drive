/**
 * Selection State Management
 *
 * Handles entity and part selection state.
 */

import { create } from "zustand";
import type { SelectionState, SelectionItem } from "@dxf-fix/shared";

export interface SelectionStateExtended extends SelectionState {
  // Actions
  setSelection: (selection: Partial<SelectionState>) => void;
  selectEntities: (entityIds: string[], fileId: string) => void;
  selectParts: (partIds: string[], fileId: string) => void;
  toggleEntity: (entityId: string, fileId: string) => void;
  togglePart: (partId: string, fileId: string) => void;
  clearSelection: () => void;
  hasSelected: (type: "entity" | "part") => boolean;
}

const DEFAULT_SELECTION: SelectionState = {
  parts: [],
  entities: [],
};

export const useSelectionStore = create<SelectionStateExtended>((set, get) => ({
  ...DEFAULT_SELECTION,

  setSelection: (selection) =>
    set((state) => ({
      ...state,
      ...selection,
    })),

  selectEntities: (entityIds, fileId) =>
    set({
      entities: entityIds.map((id) => ({ id, fileId })),
    }),

  selectParts: (partIds, fileId) =>
    set({
      parts: partIds.map((id) => ({ id, fileId })),
    }),

  toggleEntity: (entityId, fileId) =>
    set((state) => {
      const existing = state.entities.find(
        (e) => e.id === entityId && e.fileId === fileId,
      );
      if (existing) {
        return {
          entities: state.entities.filter((e) => e !== existing),
        };
      }
      return {
        entities: [...state.entities, { id: entityId, fileId }],
      };
    }),

  togglePart: (partId, fileId) =>
    set((state) => {
      const existing = state.parts.find(
        (p) => p.id === partId && p.fileId === fileId,
      );
      if (existing) {
        return {
          parts: state.parts.filter((p) => p !== existing),
        };
      }
      return {
        parts: [...state.parts, { id: partId, fileId }],
      };
    }),

  clearSelection: () => set(DEFAULT_SELECTION),

  hasSelected: (type) => {
    const state = get();
    return type === "entity"
      ? state.entities.length > 0
      : state.parts.length > 0;
  },
}));
