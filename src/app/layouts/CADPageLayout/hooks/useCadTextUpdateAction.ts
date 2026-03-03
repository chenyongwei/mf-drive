import { useCallback } from "react";
import type { TextUpdatePayload } from "../../../components/CAD/components/TextPropertiesPanel";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";

interface UseCadTextUpdateActionOptions {
  selectedTextEntity: Entity | null;
  enqueueFileEdit: (fileId: string, task: () => Promise<void>) => Promise<void>;
  executeEditCommand: (input: {
    fileId: string;
    command: string;
    params: Record<string, unknown>;
  }) => Promise<{
    success: boolean;
    message?: string;
  }>;
  refreshFileEntities: (fileId: string) => Promise<void>;
  fetchHistoryState: (fileId: string) => Promise<void>;
  setSelectedEntityIds: (entityIds: string[]) => void;
}

export function useCadTextUpdateAction({
  selectedTextEntity,
  enqueueFileEdit,
  executeEditCommand,
  refreshFileEntities,
  fetchHistoryState,
  setSelectedEntityIds,
}: UseCadTextUpdateActionOptions) {
  return useCallback(
    async (payload: TextUpdatePayload) => {
      if (!selectedTextEntity || !selectedTextEntity.fileId) {
        throw new Error("请选择单个文字实体");
      }

      const fileId = String(selectedTextEntity.fileId);
      const entityId = selectedTextEntity.id;

      await enqueueFileEdit(fileId, async () => {
        try {
          const response = await executeEditCommand({
            fileId,
            command: "update-text",
            params: {
              entityId,
              textData: payload,
            },
          });
          if (!response.success) {
            const errorMessage =
              response.message && response.message.trim().length > 0
                ? response.message
                : "文字更新失败";
            throw new Error(errorMessage);
          }
          await refreshFileEntities(fileId);
          await fetchHistoryState(fileId);
          setSelectedEntityIds([entityId]);
        } catch (error) {
          console.error("[CADPageLayout] update-text failed:", error);
          if (error instanceof Error && error.message.trim().length > 0) {
            throw error;
          }
          throw new Error("文字更新失败，请重试");
        }
      });
    },
    [
      selectedTextEntity,
      enqueueFileEdit,
      executeEditCommand,
      refreshFileEntities,
      fetchHistoryState,
      setSelectedEntityIds,
    ],
  );
}
