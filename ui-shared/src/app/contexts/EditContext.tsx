import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { EditMode, EditTool, EditState, EditOperation, Part } from '../types/editing';
import { CurrentEditOperation, EditContextType, EntitiesUpdatedCallback } from './EditContext.types';
import { useEditCommands } from './useEditCommands';

const EditContext = createContext<EditContextType | null>(null);

export const useEdit = () => {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEdit must be used within EditProvider');
  }
  return context;
};

export const EditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editState, setEditState] = useState<EditState>({
    mode: 'view',
    tool: 'select',
    selectedEntityIds: new Set(),
    hoverEntityId: null,
    editHistory: [],
    historyIndex: -1,
    parts: new Map(),
    selectedPartIds: new Set(),
  });

  const [parts, setParts] = useState<Map<string, Part>>(new Map());
  const [editOperation, setEditOperation] = useState<CurrentEditOperation>({
    step: null,
    boundaryEntityId: null,
  });

  const [onEntitiesUpdated, setOnEntitiesUpdated] = useState<EntitiesUpdatedCallback>(() => () => {});

  const setOnEntitiesUpdatedCallback = useCallback((callback: EntitiesUpdatedCallback) => {
    setOnEntitiesUpdated(() => callback);
  }, []);

  const addOperation = useCallback((operation: EditOperation) => {
    setEditState(prev => {
      const newHistory = prev.editHistory.slice(0, prev.historyIndex + 1);
      newHistory.push(operation);
      return {
        ...prev,
        editHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const setMode = useCallback((mode: EditMode) => {
    setEditState(prev => ({ ...prev, mode, selectedEntityIds: new Set(), selectedPartIds: new Set() }));
  }, []);

  const setTool = useCallback((tool: EditTool) => {
    setEditState(prev => ({ ...prev, tool }));
  }, []);

  const selectEntity = useCallback((entityId: string) => {
    setEditState(prev => ({ ...prev, selectedEntityIds: new Set([entityId]), selectedPartIds: new Set() }));
  }, []);

  const selectMultipleEntities = useCallback((entityIds: string[]) => {
    setEditState(prev => ({ ...prev, selectedEntityIds: new Set(entityIds), selectedPartIds: new Set() }));
  }, []);

  const clearSelection = useCallback(() => {
    setEditState(prev => ({ ...prev, selectedEntityIds: new Set(), selectedPartIds: new Set() }));
  }, []);

  const hoverEntity = useCallback((entityId: string | null) => {
    setEditState(prev => ({ ...prev, hoverEntityId: entityId }));
  }, []);

  const deleteSelected = useCallback(() => {
    // Will be implemented when we have entity management.
  }, []);

  const undo = useCallback(() => {
    // Will be implemented.
  }, []);

  const redo = useCallback(() => {
    // Will be implemented.
  }, []);

  const addPart = useCallback((part: Part) => {
    setParts(prev => {
      const next = new Map(prev);
      next.set(part.id, part);
      return next;
    });
  }, []);

  const removePart = useCallback((partId: string) => {
    setParts(prev => {
      const next = new Map(prev);
      next.delete(partId);
      return next;
    });
  }, []);

  const updatePart = useCallback((partId: string, updates: Partial<Part>) => {
    setParts(prev => {
      const next = new Map(prev);
      const part = next.get(partId);
      if (part) {
        next.set(partId, { ...part, ...updates });
      }
      return next;
    });
  }, []);

  const selectPart = useCallback((partId: string) => {
    setEditState(prev => ({ ...prev, selectedPartIds: new Set([partId]), selectedEntityIds: new Set() }));
  }, []);

  const clearPartSelection = useCallback(() => {
    setEditState(prev => ({ ...prev, selectedPartIds: new Set() }));
  }, []);

  const {
    executeTrim,
    executeExtend,
    executeDelete,
    executeExplode,
    executeCreate,
    recognizeParts,
  } = useEditCommands({
    onEntitiesUpdated,
    addOperation,
    clearSelection,
    setEditOperation,
    addPart,
  });

  const updateEntity = useCallback((entityId: string, newGeometry: Record<string, unknown>) => {
    void entityId;
    void newGeometry;
  }, []);

  const trimEntity = useCallback((entityId: string, boundaryEntityId: string, trimPoint: Record<string, unknown>) => {
    void entityId;
    void boundaryEntityId;
    void trimPoint;
  }, []);

  const extendEntity = useCallback((entityId: string, targetEntityId: string, extensionPoint: Record<string, unknown>) => {
    void entityId;
    void targetEntityId;
    void extensionPoint;
  }, []);

  const canUndo = editState.historyIndex > 0;
  const canRedo = editState.historyIndex < editState.editHistory.length - 1;

  const value = useMemo<EditContextType>(() => ({
    editState,
    setMode,
    setTool,
    selectEntity,
    selectMultipleEntities,
    clearSelection,
    hoverEntity,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    parts,
    setParts,
    addPart,
    removePart,
    updatePart,
    selectPart,
    clearPartSelection,
    executeTrim,
    executeExtend,
    executeDelete,
    executeExplode,
    executeCreate,
    onEntitiesUpdated,
    setOnEntitiesUpdated: setOnEntitiesUpdatedCallback,
    updateEntity,
    trimEntity,
    extendEntity,
    recognizeParts,
    editOperation,
    setEditOperation,
  }), [
    editState,
    setMode,
    setTool,
    selectEntity,
    selectMultipleEntities,
    clearSelection,
    hoverEntity,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    parts,
    setParts,
    addPart,
    removePart,
    updatePart,
    selectPart,
    clearPartSelection,
    executeTrim,
    executeExtend,
    executeDelete,
    executeExplode,
    executeCreate,
    onEntitiesUpdated,
    setOnEntitiesUpdatedCallback,
    updateEntity,
    trimEntity,
    extendEntity,
    recognizeParts,
    editOperation,
    setEditOperation,
  ]);

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
};
