import { useCallback } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { InspectionResult } from "@dxf-fix/shared/types/inspection";
import type { FileData } from "../CADPageLayout.file-utils";

interface UseCadInspectionActionsOptions {
  files: FileData[];
  checkedFileIds: Set<string>;
  selectedEntityIds: string[];
  getTestModeParams: () => string;
  setIsInspecting: (value: boolean) => void;
  setEntitiesMap: (
    updater: (prev: Record<string, Entity[]>) => Record<string, Entity[]>,
  ) => void;
  setInspectionResult: (result: InspectionResult | null) => void;
  setInspectionCoordinateSpace: (value: "local" | "world") => void;
}

export function useCadInspectionActions({
  files,
  checkedFileIds,
  selectedEntityIds,
  getTestModeParams,
  setIsInspecting,
  setEntitiesMap,
  setInspectionResult,
  setInspectionCoordinateSpace,
}: UseCadInspectionActionsOptions) {
  const handleFixAll = useCallback(async () => {
    const dxfFiles = files.filter((file) => file.type === "DXF");
    const checkedDxfFileIds = Array.from(checkedFileIds).filter((id) =>
      dxfFiles.some((file) => file.id === id),
    );
    if (checkedDxfFileIds.length === 0) {
      console.warn("[FixAll] No DXF files checked");
      return;
    }

    const fileId = checkedDxfFileIds[0];
    setIsInspecting(true);
    try {
      const testParams = getTestModeParams();
      const response = await fetch(`/api/drawing/files/${fileId}/fix-all${testParams}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.entities && result.entities.length > 0) {
        const entitiesWithFileId = result.entities.map((entity: any) => ({
          ...entity,
          fileId,
        }));
        setEntitiesMap((prev) => ({
          ...prev,
          [fileId]: entitiesWithFileId,
        }));
      }

      if (result.inspectionResult) {
        setInspectionResult(result.inspectionResult);
        setInspectionCoordinateSpace("local");
      }

      if (result.fixedCount > 0) {
        alert(
          `已修复 ${result.fixedCount} 个问题，移除了 ${result.removedEntityCount} 个重复实体`,
        );
      }
    } catch (error: any) {
      console.error("❌ Fix All failed:", error);
      alert(error.message || "修复失败，请重试");
    } finally {
      setIsInspecting(false);
    }
  }, [
    files,
    checkedFileIds,
    getTestModeParams,
    setIsInspecting,
    setEntitiesMap,
    setInspectionResult,
    setInspectionCoordinateSpace,
  ]);

  const handleTriggerInspection = useCallback(async () => {
    const dxfFiles = files.filter((file) => file.type === "DXF");
    const checkedDxfFileIds = Array.from(checkedFileIds).filter((id) =>
      dxfFiles.some((file) => file.id === id),
    );
    if (checkedDxfFileIds.length === 0) {
      console.warn("No DXF files checked for inspection");
      return;
    }

    setIsInspecting(true);
    try {
      const testParams = getTestModeParams();
      const response = await fetch(`/api/drawing/files/inspect-batch${testParams}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: checkedDxfFileIds,
          entityIds:
            selectedEntityIds.length > 0 ? selectedEntityIds : undefined,
          tolerance: 0.5,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: InspectionResult = await response.json();
      setInspectionResult(result);
      setInspectionCoordinateSpace("local");
    } catch (error) {
      console.error("❌ Inspection failed:", error);
    } finally {
      setIsInspecting(false);
    }
  }, [
    files,
    checkedFileIds,
    selectedEntityIds,
    getTestModeParams,
    setIsInspecting,
    setInspectionResult,
    setInspectionCoordinateSpace,
  ]);

  return {
    handleFixAll,
    handleTriggerInspection,
  };
}
