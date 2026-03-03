import { useCallback } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { getEntityBBox } from "../../../utils/entityBBox";
import { translateEntity } from "../../../utils/entityTransform";
import type { FileData } from "../CADPageLayout.file-utils";

interface FileLayoutLike {
  fileId: string;
  offsetX: number;
  offsetY: number;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

interface UseCadDragHandlersOptions {
  isScaleMode: boolean;
  isNestingMode: boolean;
  draggedEntityInfo: { id: string; offset: { x: number; y: number } } | null;
  setDraggedEntityInfo: (value: { id: string; offset: { x: number; y: number } } | null) => void;
  zoom: number;
  layoutEntities: Entity[];
  fileLayouts: FileLayoutLike[];
  buildDefaultDrawingFileName: () => string;
  requestFileName: (defaultName: string, title?: string) => Promise<string | null>;
  enqueueFileEdit: (fileId: string, task: () => Promise<void>) => Promise<void>;
  refreshFileEntities: (fileId: string) => Promise<void>;
  history: { fetchHistoryState: (fileId: string) => Promise<void> };
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    durationMs?: number,
  ) => void;
  executeEditCommand: (input: {
    fileId: string;
    command: string;
    params: Record<string, unknown>;
  }) => Promise<{ success: boolean; message?: string }>;
  setEntitiesMap: (
    updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>,
  ) => void;
  setFiles: (updater: (prev: FileData[]) => FileData[]) => void;
  setCheckedFileIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setSelectedFileId: (value: string | null) => void;
  setShouldFitToView: (value: boolean) => void;
}

export function useCadDragHandlers({
  isScaleMode,
  isNestingMode,
  draggedEntityInfo,
  setDraggedEntityInfo,
  zoom,
  layoutEntities,
  fileLayouts,
  buildDefaultDrawingFileName,
  requestFileName,
  enqueueFileEdit,
  refreshFileEntities,
  history,
  showPartActionToast,
  executeEditCommand,
  setEntitiesMap,
  setFiles,
  setCheckedFileIds,
  setSelectedFileId,
  setShouldFitToView,
}: UseCadDragHandlersOptions) {
  const handleEntityDragStart = useCallback(
    (entityId: string, _startScreenPos?: { x: number; y: number }) => {
      if (isScaleMode || isNestingMode) return;
      setDraggedEntityInfo({ id: entityId, offset: { x: 0, y: 0 } });
    },
    [isScaleMode, isNestingMode, setDraggedEntityInfo],
  );

  const handleEntityDrag = useCallback(
    (entityId: string, _currentScreenPos: { x: number; y: number }, delta: { x: number; y: number }) => {
      if (!draggedEntityInfo || draggedEntityInfo.id !== entityId) return;
      setDraggedEntityInfo({
        id: entityId,
        offset: { x: delta.x / zoom, y: delta.y / zoom },
      });
    },
    [draggedEntityInfo, zoom, setDraggedEntityInfo],
  );

  const handleEntityDragEnd = useCallback(
    (entityId: string, _endScreenPos?: { x: number; y: number }) => {
      if (!draggedEntityInfo || draggedEntityInfo.id !== entityId) return;
      const { offset } = draggedEntityInfo;
      setDraggedEntityInfo(null);

      const entity = layoutEntities.find((candidate) => candidate.id === entityId);
      if (!entity || !entity.fileId) return;

      const oldBox = getEntityBBox(entity);
      const centerX = (oldBox.minX + oldBox.maxX) / 2 + offset.x;
      const centerY = (oldBox.minY + oldBox.maxY) / 2 + offset.y;
      const targetLayout = fileLayouts.find((layout) =>
        centerX >= layout.boundingBox.minX &&
        centerX <= layout.boundingBox.maxX &&
        centerY >= layout.boundingBox.minY &&
        centerY <= layout.boundingBox.maxY,
      );

      if (!targetLayout) {
        void (async () => {
          const defaultName = buildDefaultDrawingFileName();
          const fileName = await requestFileName(defaultName);
          if (fileName === null) return;

          const newFileId = `file-${Date.now()}`;
          setFiles((prev) => [...prev, { id: newFileId, name: fileName, type: "DXF", fileId: newFileId }]);
          setCheckedFileIds((prev) => new Set(prev).add(newFileId));
          setEntitiesMap((prev) => {
            const next = { ...prev };
            const sourceFileId = String(entity.fileId);
            if (next[sourceFileId]) next[sourceFileId] = next[sourceFileId].filter((candidate) => candidate.id !== entityId);
            const moved = translateEntity(entity, offset.x, offset.y);
            const bbox = getEntityBBox(moved);
            const normalized = translateEntity(moved, -bbox.minX, -bbox.minY);
            next[newFileId] = [{ ...normalized, fileId: newFileId, layer: "0", color: entity.color }];
            return next;
          });
          setSelectedFileId(newFileId);
          setShouldFitToView(true);
        })();
        return;
      }

      const sourceFileId = String(entity.fileId);
      const targetFileId = String(targetLayout.fileId);
      if (targetFileId === sourceFileId) {
        setEntitiesMap((prev) => {
          const next = { ...prev };
          const sourceEntities = [...(next[sourceFileId] || [])];
          const sourceIndex = sourceEntities.findIndex((candidate) => candidate.id === entity.id);
          if (sourceIndex !== -1) {
            sourceEntities[sourceIndex] = translateEntity(sourceEntities[sourceIndex], offset.x, offset.y);
            next[sourceFileId] = sourceEntities;
          }
          return next;
        });

        void enqueueFileEdit(sourceFileId, async () => {
          const response = await executeEditCommand({
            fileId: sourceFileId,
            command: "move",
            params: { entityId, delta: { x: offset.x, y: offset.y } },
          });
          if (!response.success) {
            showPartActionToast(response.message || "拖动保存失败", "error", 3200);
            await refreshFileEntities(sourceFileId);
            return;
          }
          await refreshFileEntities(sourceFileId);
          await history.fetchHistoryState(sourceFileId);
        });
        return;
      }

      const movedEntity = translateEntity(entity, offset.x, offset.y);
      const localEntity = translateEntity(movedEntity, -targetLayout.offsetX, -targetLayout.offsetY);
      const targetEntity = { ...localEntity, fileId: targetFileId, layer: "0", color: entity.color };
      setEntitiesMap((prev) => {
        const next = { ...prev };
        next[sourceFileId] = (next[sourceFileId] || []).filter((candidate) => candidate.id !== entityId);
        next[targetFileId] = [...(next[targetFileId] || []), targetEntity];
        return next;
      });

      void (async () => {
        let createSuccess = false;
        await enqueueFileEdit(targetFileId, async () => {
          const response = await executeEditCommand({
            fileId: targetFileId,
            command: "create",
            params: { entityData: targetEntity },
          });
          if (!response.success) {
            showPartActionToast(response.message || "跨文件拖动失败：目标文件创建失败", "error", 3200);
            return;
          }
          createSuccess = true;
          await refreshFileEntities(targetFileId);
          await history.fetchHistoryState(targetFileId);
        });

        if (!createSuccess) {
          await refreshFileEntities(sourceFileId);
          return;
        }

        await enqueueFileEdit(sourceFileId, async () => {
          const response = await executeEditCommand({
            fileId: sourceFileId,
            command: "delete",
            params: { entityId },
          });
          if (!response.success) {
            showPartActionToast(response.message || "跨文件拖动失败：源文件删除失败", "error", 3200);
            return;
          }
          await refreshFileEntities(sourceFileId);
          await history.fetchHistoryState(sourceFileId);
        });
      })();
    },
    [
      draggedEntityInfo,
      layoutEntities,
      fileLayouts,
      setDraggedEntityInfo,
      buildDefaultDrawingFileName,
      requestFileName,
      setFiles,
      setCheckedFileIds,
      setEntitiesMap,
      setSelectedFileId,
      setShouldFitToView,
      enqueueFileEdit,
      executeEditCommand,
      showPartActionToast,
      refreshFileEntities,
      history,
    ],
  );

  const handleEntityDragCancel = useCallback((_entityId?: string) => {
    setDraggedEntityInfo(null);
  }, [setDraggedEntityInfo]);

  return {
    handleEntityDragStart,
    handleEntityDrag,
    handleEntityDragEnd,
    handleEntityDragCancel,
  };
}
