/**
 * useEntitySync - Unified entity sync hook for optimistic updates + backend persistence
 *
 * Provides a single interface for all entity operations (delete, move, copy, rotate, scale)
 * with optimistic frontend updates and async backend persistence.
 */

import { useCallback, useRef } from 'react';
import { useEdit } from '../../../contexts/EditContext';
import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { translateEntity } from '../../../utils/entityTransform';

const createVersionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface UseEntitySyncProps {
  fileId: string | null;
  entities: Entity[];
  selectedEntityIds: string[];
  setEntitiesMap: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setSelectedEntityIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useEntitySync({
  fileId,
  entities,
  selectedEntityIds,
  setEntitiesMap,
  setSelectedEntityIds,
}: UseEntitySyncProps) {
  const edit = useEdit();
  const clipboardRef = useRef<Entity[]>([]);

  // Delete selected entities (optimistic)
  const deleteSelected = useCallback(async () => {
    if (!fileId || selectedEntityIds.length === 0) return;

    // Optimistic: remove from frontend immediately
    setEntitiesMap(prev => {
      const fileEntities = prev[fileId] || [];
      const idSet = new Set(selectedEntityIds);
      return { ...prev, [fileId]: fileEntities.filter(e => !idSet.has(e.id)) };
    });
    setSelectedEntityIds([]);

    // Persist to backend
    try {
      await edit.executeDelete(fileId, selectedEntityIds);
    } catch (error) {
      console.error('Delete sync failed, entities may need refresh:', error);
    }
  }, [fileId, selectedEntityIds, setEntitiesMap, setSelectedEntityIds, edit]);

  // Move selected entities by delta (optimistic)
  const moveSelected = useCallback(async (delta: { x: number; y: number }) => {
    if (!fileId || selectedEntityIds.length === 0) return;

    const idSet = new Set(selectedEntityIds);

    // Optimistic: update positions immediately
    setEntitiesMap(prev => {
      const fileEntities = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: fileEntities.map(e =>
          idSet.has(e.id) ? translateEntity(e, delta.x, delta.y) : e
        ),
      };
    });

    // Persist to backend
    try {
      await edit.executeMove(fileId, selectedEntityIds, delta);
    } catch (error) {
      console.error('Move sync failed:', error);
    }
  }, [fileId, selectedEntityIds, setEntitiesMap, edit]);

  // Copy selected entities to clipboard
  const copyToClipboard = useCallback(() => {
    if (selectedEntityIds.length === 0) return;
    const idSet = new Set(selectedEntityIds);
    clipboardRef.current = entities
      .filter(e => idSet.has(e.id))
      .map(entity => ({
        ...entity,
        versionToken: entity.versionToken ?? createVersionToken(),
      }));
  }, [selectedEntityIds, entities]);

  // Paste from clipboard with offset
  const pasteFromClipboard = useCallback(async (delta: { x: number; y: number } = { x: 20, y: 20 }) => {
    if (!fileId || clipboardRef.current.length === 0) return;

    const sourceIds = clipboardRef.current.map(e => e.id);

    // Optimistic: create copies in frontend
    const newEntities = clipboardRef.current.map(e => {
      const copied = translateEntity(e, delta.x, delta.y);
      return {
        ...copied,
        id: `${e.id}_copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        versionToken: createVersionToken(),
      };
    });

    setEntitiesMap(prev => {
      const fileEntities = prev[fileId] || [];
      return { ...prev, [fileId]: [...fileEntities, ...newEntities] };
    });

    // Select the new copies
    setSelectedEntityIds(newEntities.map(e => e.id));

    // Persist to backend
    try {
      await edit.executeCopy(fileId, sourceIds, delta);
    } catch (error) {
      console.error('Copy sync failed:', error);
    }
  }, [fileId, setEntitiesMap, setSelectedEntityIds, edit]);

  // Rotate selected entities
  const rotateSelected = useCallback(async (center: { x: number; y: number }, angle: number) => {
    if (!fileId || selectedEntityIds.length === 0) return;

    // Persist to backend (rotation geometry transform is complex, let backend handle it)
    try {
      await edit.executeRotate(fileId, selectedEntityIds, center, angle);
    } catch (error) {
      console.error('Rotate sync failed:', error);
    }
  }, [fileId, selectedEntityIds, edit]);

  // Scale selected entities
  const scaleSelected = useCallback(async (center: { x: number; y: number }, factor: number) => {
    if (!fileId || selectedEntityIds.length === 0) return;

    try {
      await edit.executeScale(fileId, selectedEntityIds, center, factor);
    } catch (error) {
      console.error('Scale sync failed:', error);
    }
  }, [fileId, selectedEntityIds, edit]);

  return {
    deleteSelected,
    moveSelected,
    copyToClipboard,
    pasteFromClipboard,
    rotateSelected,
    scaleSelected,
    hasClipboard: clipboardRef.current.length > 0,
  };
}
