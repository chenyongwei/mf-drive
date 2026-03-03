/**
 * File State Management
 *
 * Handles file CRUD operations, status tracking, and active file management.
 */

import { create } from "zustand";
import type { FileInfo } from "@dxf-fix/shared";

export interface FilesState {
  // State
  files: Map<string, FileInfo>;
  activeFileId: string | null;
  activePartId: string | null;

  // Computed getters
  getActiveFile: () => FileInfo | null;
  getReadyFiles: () => FileInfo[];
  getFilesByStatus: (status: FileInfo["status"]) => FileInfo[];

  // Actions
  addFile: (file: FileInfo) => void;
  removeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  setActivePart: (partId: string | null) => void;
  updateFile: (fileId: string, updates: Partial<FileInfo>) => void;
  updateFileStatus: (fileId: string, status: FileInfo["status"]) => void;
  clearFiles: () => void;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  // Initial state
  files: new Map(),
  activeFileId: null,
  activePartId: null,

  // Computed getters
  getActiveFile: () => {
    const { files, activeFileId } = get();
    return activeFileId ? files.get(activeFileId) || null : null;
  },

  getReadyFiles: () => {
    const { files } = get();
    return Array.from(files.values()).filter((f) => f.status === "ready");
  },

  getFilesByStatus: (status) => {
    const { files } = get();
    return Array.from(files.values()).filter((f) => f.status === status);
  },

  // Actions
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

  updateFileStatus: (fileId, status) =>
    set((state) => {
      const newFiles = new Map(state.files);
      const file = newFiles.get(fileId);
      if (file) {
        newFiles.set(fileId, { ...file, status });
      }
      return { files: newFiles };
    }),

  clearFiles: () =>
    set({
      files: new Map(),
      activeFileId: null,
      activePartId: null,
    }),
}));
