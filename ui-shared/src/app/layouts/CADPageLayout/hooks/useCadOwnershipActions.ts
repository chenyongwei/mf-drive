import { useCallback, useEffect } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { FileData } from "../CADPageLayout.file-utils";
import { getEntityBBox } from "../../../utils/entityBBox";
import { translateEntity } from "../../../utils/entityTransform";
import {
  resolveEntityOwnership,
  resolveOwnershipDialogSelection,
} from "../../../components/CAD/utils/fileOwnershipResolver";
import type { OwnershipDialogState } from "./useCadOwnershipController";

interface FileLayoutLike {
  fileId: string;
  offsetX: number;
  offsetY: number;
}

interface UseCadOwnershipActionsOptions {
  fileLayouts: FileLayoutLike[];
  files: FileData[];
  ownershipDialog: OwnershipDialogState;
  closeOwnershipDialog: () => void;
  openOwnershipDialog: (pendingEntity: Entity, candidates: any[]) => void;
  requestFileName: (defaultName: string, title?: string) => Promise<string | null>;
  enqueueFileEdit: (fileId: string, task: () => Promise<void>) => Promise<void>;
  executeCreate: (fileId: string, entityData: Entity) => Promise<{ success: boolean }>;
  refreshFileEntities: (fileId: string, fileOverride?: FileData) => Promise<void>;
  fetchHistoryState: (fileId: string) => Promise<void>;
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    durationMs?: number,
  ) => void;
  setFiles: (updater: (prev: FileData[]) => FileData[]) => void;
  setCheckedFileIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setSelectedFileId: (value: string | null) => void;
  setPreferredLayoutAnchorFileId: (value: string | null) => void;
  setActiveTab: (value: "DXF" | "PRTS") => void;
  setEntitiesMap: (updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>) => void;
  setShouldFitToView: (value: boolean) => void;
}

export function useCadOwnershipActions({
  fileLayouts,
  files,
  ownershipDialog,
  closeOwnershipDialog,
  openOwnershipDialog,
  requestFileName,
  enqueueFileEdit,
  executeCreate,
  refreshFileEntities,
  fetchHistoryState,
  showPartActionToast,
  setFiles,
  setCheckedFileIds,
  setSelectedFileId,
  setPreferredLayoutAnchorFileId,
  setActiveTab,
  setEntitiesMap,
  setShouldFitToView,
}: UseCadOwnershipActionsOptions) {
  const buildDefaultDrawingFileName = useCallback(() => {
    return new Date()
      .toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/\//g, "-")
      .replace(/:/g, "-")
      .replace(" ", "-");
  }, []);

  const createNewDrawingFileFromEntity = useCallback(
    async (worldEntity: Entity) => {
      const defaultName = buildDefaultDrawingFileName();
      const nextNameInput = await requestFileName(defaultName);
      if (nextNameInput === null) return;

      const trimmed = nextNameInput.trim();
      const nextName = trimmed.length > 0 ? trimmed : defaultName;
      const createdAt = new Date().toISOString();
      const newFileId = `file-${Date.now()}`;
      const newFileData: FileData = {
        id: newFileId,
        name: nextName,
        type: "DXF",
        fileId: newFileId,
        createdAt,
        status: "ready",
      };

      setFiles((prev) => {
        const updated = [newFileData, ...prev];
        return updated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      });
      setCheckedFileIds((prev) => new Set(prev).add(newFileId));
      setSelectedFileId(newFileId);
      setPreferredLayoutAnchorFileId(newFileId);
      setActiveTab("DXF");

      const bbox = getEntityBBox(worldEntity);
      const normalizedEntity = { ...translateEntity(worldEntity, -bbox.minX, -bbox.minY), fileId: newFileId };
      setEntitiesMap((prev) => ({ ...prev, [newFileId]: [normalizedEntity] }));

      await enqueueFileEdit(newFileId, async () => {
        try {
          const createResponse = await executeCreate(newFileId, normalizedEntity);
          if (!createResponse.success) {
            showPartActionToast("图形保存失败，请重试", "error", 3200);
            return;
          }
          await refreshFileEntities(newFileId, newFileData);
          await fetchHistoryState(newFileId);
        } catch (error) {
          console.error("[CADPageLayout] create first entity for new file failed:", error);
          showPartActionToast("图形保存失败，请重试", "error", 3200);
        }
      });
      setShouldFitToView(true);
    },
    [
      buildDefaultDrawingFileName,
      requestFileName,
      setFiles,
      setCheckedFileIds,
      setSelectedFileId,
      setPreferredLayoutAnchorFileId,
      setActiveTab,
      setEntitiesMap,
      enqueueFileEdit,
      executeCreate,
      showPartActionToast,
      refreshFileEntities,
      fetchHistoryState,
      setShouldFitToView,
    ],
  );

  const applyEntityToFile = useCallback(
    async (targetFileId: string, worldEntity: Entity) => {
      const targetLayout = fileLayouts.find((fileLayout) => fileLayout.fileId === targetFileId);
      if (!targetLayout) return createNewDrawingFileFromEntity(worldEntity);

      const localEntity = translateEntity(worldEntity, -(targetLayout.offsetX || 0), -(targetLayout.offsetY || 0));
      const entityWithFileId = { ...localEntity, fileId: targetFileId };
      if (targetFileId === "scratchpad") {
        setEntitiesMap((prev) => ({ ...prev, [targetFileId]: [...(prev[targetFileId] || []), entityWithFileId] }));
      } else {
        await enqueueFileEdit(targetFileId, async () => {
          try {
            const createResponse = await executeCreate(targetFileId, entityWithFileId);
            if (!createResponse.success) {
              showPartActionToast("图形保存失败，请重试", "error", 3200);
              return;
            }
            await refreshFileEntities(targetFileId);
            await fetchHistoryState(targetFileId);
          } catch (error) {
            console.error("[CADPageLayout] create entity failed:", error);
            showPartActionToast("图形保存失败，请重试", "error", 3200);
          }
        });
      }
      setPreferredLayoutAnchorFileId(targetFileId);
    },
    [
      fileLayouts,
      createNewDrawingFileFromEntity,
      setEntitiesMap,
      enqueueFileEdit,
      executeCreate,
      showPartActionToast,
      refreshFileEntities,
      fetchHistoryState,
      setPreferredLayoutAnchorFileId,
    ],
  );

  const handleEntityCreate = useCallback(
    (newEntity: Entity) => {
      const ownership = resolveEntityOwnership({
        entityBBox: getEntityBBox(newEntity),
        fileLayouts,
        files,
      });
      if (ownership.kind === "new-file") return void createNewDrawingFileFromEntity(newEntity);
      if (ownership.kind === "existing") return void applyEntityToFile(ownership.targetFileId, newEntity);
      openOwnershipDialog(newEntity, ownership.candidates);
    },
    [fileLayouts, files, createNewDrawingFileFromEntity, applyEntityToFile, openOwnershipDialog],
  );

  const confirmOwnershipDialog = useCallback(() => {
    const selection = resolveOwnershipDialogSelection(ownershipDialog.selectedTargetId);
    const pendingEntity = ownershipDialog.pendingEntity;
    closeOwnershipDialog();
    if (!selection || !pendingEntity) return;
    if (selection.kind === "new-file") return void createNewDrawingFileFromEntity(pendingEntity);
    void applyEntityToFile(selection.targetFileId, pendingEntity);
  }, [ownershipDialog.selectedTargetId, ownershipDialog.pendingEntity, closeOwnershipDialog, createNewDrawingFileFromEntity, applyEntityToFile]);

  const onOwnershipDialogKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!ownershipDialog.isOpen || event.nativeEvent.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeOwnershipDialog();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        confirmOwnershipDialog();
      }
    },
    [ownershipDialog.isOpen, closeOwnershipDialog, confirmOwnershipDialog],
  );

  useEffect(() => {
    if (!ownershipDialog.isOpen) return;
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if ((event as KeyboardEvent & { isComposing?: boolean }).isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeOwnershipDialog();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        confirmOwnershipDialog();
      }
    };
    window.addEventListener("keydown", onWindowKeyDown, true);
    return () => window.removeEventListener("keydown", onWindowKeyDown, true);
  }, [ownershipDialog.isOpen, closeOwnershipDialog, confirmOwnershipDialog]);

  return {
    buildDefaultDrawingFileName,
    createNewDrawingFileFromEntity,
    applyEntityToFile,
    handleEntityCreate,
    confirmOwnershipDialog,
    onOwnershipDialogKeyDownCapture,
  };
}
