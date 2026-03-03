import { useState, useCallback } from 'react';

interface UseFileSelectionResult {
  selectedFileIds: Set<string>;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: (fileIds: string[]) => void;
  deselectAllFiles: () => void;
  selectedCount: number;
}

export function useFileSelection(): UseFileSelectionResult {
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const selectAllFiles = useCallback((fileIds: string[]) => {
    setSelectedFileIds(new Set(fileIds));
  }, []);

  const deselectAllFiles = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  return {
    selectedFileIds,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    selectedCount: selectedFileIds.size,
  };
}
