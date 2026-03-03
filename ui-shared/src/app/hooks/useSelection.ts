import { useState, useCallback } from 'react';

export interface UseSelectionResult<T> {
  selectedIds: Set<T>;
  selectedCount: number;
  isSelected: (id: T) => boolean;
  select: (id: T) => void;
  deselect: (id: T) => void;
  toggle: (id: T) => void;
  selectAll: (ids: T[]) => void;
  deselectAll: () => void;
  clear: () => void;
}

export function useSelection<T extends string | number>(initialIds: T[] = []): UseSelectionResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set(initialIds));

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const select = useCallback((id: T) => {
    setSelectedIds(new Set([id]));
  }, []);

  const deselect = useCallback((id: T) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCallback((id: T) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const clear = deselectAll;

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    clear,
  };
}
