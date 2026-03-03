import { useCallback, useEffect } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { shouldIgnoreGlobalCadShortcut } from "../CADPageLayout.behavior";
import { isNonPartGraphicEntityCandidate } from "../CADPageLayout.file-utils";

interface UseCadHistoryAndShortcutsOptions {
  selectedFileId: string | null;
  collaboration: any;
  setNestingParts: React.Dispatch<React.SetStateAction<any[]>>;
  refreshFileEntities: (fileId: string) => Promise<void>;
  history: any;
  currentUsername: string;
  selectedEntityIds: string[];
  layoutEntities: Entity[];
  showPartActionToast: (message: string, type?: any, durationMs?: number) => void;
  executeDelete: (fileId: string, entityIds: string[]) => Promise<void>;
  setSelectedEntityIds: React.Dispatch<React.SetStateAction<string[]>>;
  isNestingMode: boolean;
  isEditMode: boolean;
  activeTool: string;
  pendingTrimExtend: any;
  pendingCadAction: string | null;
  setPendingTrimExtend: React.Dispatch<React.SetStateAction<any>>;
  setPendingCadAction: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveTool: React.Dispatch<React.SetStateAction<any>>;
}

export const useCadHistoryAndShortcuts = ({
  selectedFileId,
  collaboration,
  setNestingParts,
  refreshFileEntities,
  history,
  currentUsername,
  selectedEntityIds,
  layoutEntities,
  showPartActionToast,
  executeDelete,
  setSelectedEntityIds,
  isNestingMode,
  isEditMode,
  activeTool,
  pendingTrimExtend,
  pendingCadAction,
  setPendingTrimExtend,
  setPendingCadAction,
  setActiveTool,
}: UseCadHistoryAndShortcutsOptions) => {
  useEffect(() => {
    if (selectedFileId && collaboration.isConnected) collaboration.joinRoom(selectedFileId);
    return () => {
      if (collaboration.currentRoom) collaboration.leaveRoom();
    };
  }, [selectedFileId, collaboration.isConnected]);

  useEffect(() => {
    if (collaboration.remotePartMoves.size === 0) return;
    setNestingParts((prev) => {
      let changed = false;
      const next = prev.map((part) => {
        let latestMove = null;
        for (const move of Array.from(collaboration.remotePartMoves.values())) {
          if (move.partId === part.id) latestMove = move;
        }
        if (!latestMove) return part;
        if (
          part.position.x !== latestMove.position.x ||
          part.position.y !== latestMove.position.y ||
          part.rotation !== latestMove.rotation
        ) {
          changed = true;
          return { ...part, position: latestMove.position, rotation: latestMove.rotation };
        }
        return part;
      });
      return changed ? next : prev;
    });
  }, [collaboration.remotePartMoves, setNestingParts]);

  useEffect(() => {
    const handleRemoteEdit = (_: { userId: string; operation: any }) => {
      if (selectedFileId) void refreshFileEntities(selectedFileId);
    };
    collaboration.setOnRemoteEdit(handleRemoteEdit);
    return () => collaboration.setOnRemoteEdit(null);
  }, [selectedFileId, collaboration.setOnRemoteEdit, refreshFileEntities]);

  const handleUndo = useCallback(async () => {
    if (!selectedFileId || !collaboration.myUserId) return;
    try {
      await history.undo(selectedFileId, collaboration.myUserId, currentUsername);
      await refreshFileEntities(selectedFileId);
    } catch (error) {
      console.error("[Undo] Error:", error);
    }
  }, [selectedFileId, collaboration.myUserId, history.undo, refreshFileEntities, currentUsername]);

  const handleRedo = useCallback(async () => {
    if (!selectedFileId || !collaboration.myUserId) return;
    try {
      await history.redo(selectedFileId, collaboration.myUserId, currentUsername);
      await refreshFileEntities(selectedFileId);
    } catch (error) {
      console.error("[Redo] Error:", error);
    }
  }, [selectedFileId, collaboration.myUserId, history.redo, refreshFileEntities, currentUsername]);

  const handleDeleteKey = useCallback(
    async (overrideEntityIds?: string[]) => {
      const effectiveIds =
        overrideEntityIds && overrideEntityIds.length > 0 ? overrideEntityIds : selectedEntityIds;
      if (effectiveIds.length === 0) return;
      const selectedEntities = effectiveIds
        .map((entityId) => layoutEntities.find((candidate) => candidate.id === entityId))
        .filter((candidate): candidate is Entity => Boolean(candidate?.fileId))
        .filter((candidate) => isNonPartGraphicEntityCandidate(candidate));
      if (selectedEntities.length === 0) {
        showPartActionToast("请选择可编辑图形对象", "warning");
        return;
      }
      const entityIdsByFile = new Map<string, string[]>();
      selectedEntities.forEach((entity) => {
        const fileId = String(entity.fileId);
        if (!entityIdsByFile.has(fileId)) entityIdsByFile.set(fileId, []);
        entityIdsByFile.get(fileId)!.push(entity.id);
      });
      try {
        for (const [fileId, entityIds] of entityIdsByFile.entries()) {
          await executeDelete(fileId, entityIds);
          await refreshFileEntities(fileId);
          await history.fetchHistoryState(fileId);
        }
        setSelectedEntityIds([]);
        showPartActionToast("删除成功", "success");
      } catch (error) {
        console.error("[CADPageLayout] Delete failed:", error);
        showPartActionToast("删除失败，请重试", "error");
      }
    },
    [selectedEntityIds, layoutEntities, showPartActionToast, executeDelete, refreshFileEntities, history, setSelectedEntityIds],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreGlobalCadShortcut(e)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        void handleUndo();
      }
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") || ((e.ctrlKey || e.metaKey) && e.key === "y")) {
        e.preventDefault();
        void handleRedo();
      }
      if ((e.key === "t" || e.key === "T") && !isNestingMode && isEditMode) {
        e.preventDefault();
        setPendingCadAction(null);
        setPendingTrimExtend(null);
        setActiveTool("trim");
        showPartActionToast("修剪：请选择目标对象", "info");
      }
      if ((e.key === "e" || e.key === "E") && !isNestingMode && isEditMode) {
        e.preventDefault();
        setPendingCadAction(null);
        setPendingTrimExtend(null);
        setActiveTool("extend");
        showPartActionToast("延伸：请选择目标对象", "info");
      }
      if (e.key === "Escape" || e.key === "Esc") {
        if (["trim", "extend", "delete", "explode", "draw-text"].includes(activeTool) || pendingTrimExtend || pendingCadAction) {
          e.preventDefault();
          setPendingTrimExtend(null);
          setPendingCadAction(null);
          setActiveTool("select");
          showPartActionToast("已退出编辑工具", "info", 1800);
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEntityIds.length > 0 && !isNestingMode && isEditMode) {
        e.preventDefault();
        void handleDeleteKey();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo, handleRedo, selectedEntityIds, isNestingMode, isEditMode, activeTool,
    pendingTrimExtend, pendingCadAction, showPartActionToast, handleDeleteKey,
    setPendingTrimExtend, setPendingCadAction, setActiveTool,
  ]);

  return { handleUndo, handleRedo, handleDeleteKey };
};

