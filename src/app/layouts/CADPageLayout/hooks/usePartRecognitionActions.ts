import { useCallback } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { InspectionResult } from "@dxf-fix/shared/types/inspection";
import type { FileData } from "../CADPageLayout.file-utils";
import {
  buildPartRecognitionPayload,
  resolveDxfScopeForPartActions,
} from "../CADPageLayout.part-recognition-utils";

interface UsePartRecognitionActionsOptions {
  files: FileData[];
  selectedFileId: string | null;
  checkedFileIds: Set<string>;
  selectedEntityIds: string[];
  layoutEntities: Entity[];
  getTestModeParams: () => string;
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    durationMs?: number,
  ) => void;
  refreshPrtsFileList: () => Promise<void>;
  refreshFileEntities: (fileId: string) => Promise<void>;
  applyRecognizedPartMappings: (
    fileId: string,
    recognized: Array<{
      partId?: string;
      sourceEntityIds?: string[];
      sourceFileId?: string;
      metadata?: Record<string, unknown>;
    }>,
  ) => void;
  removeRecognizedPartMappings: (fileId: string, removedPartIds: string[]) => void;
  setSelectedEntityIds: (value: string[]) => void;
  setInspectionResult: (value: InspectionResult | null) => void;
  setInspectionCoordinateSpace: (value: "local" | "world") => void;
}

export function usePartRecognitionActions({
  files,
  selectedFileId,
  checkedFileIds,
  selectedEntityIds,
  layoutEntities,
  getTestModeParams,
  showPartActionToast,
  refreshPrtsFileList,
  refreshFileEntities,
  applyRecognizedPartMappings,
  removeRecognizedPartMappings,
  setSelectedEntityIds,
  setInspectionResult,
  setInspectionCoordinateSpace,
}: UsePartRecognitionActionsOptions) {
  const resolveScope = useCallback(() => {
    return resolveDxfScopeForPartActions({
      selectedEntityIds,
      layoutEntities,
      files,
      selectedFileId,
      checkedFileIds,
    });
  }, [selectedEntityIds, layoutEntities, files, selectedFileId, checkedFileIds]);

  const handleIdentifyPart = useCallback(async () => {
    const scope = resolveScope();
    if (!scope) {
      showPartActionToast("请先选择DXF文件或实体", "warning");
      return;
    }

    const testParams = getTestModeParams();
    const payload = buildPartRecognitionPayload(scope, layoutEntities);
    if (
      scope.entityIds.length > 0 &&
      (!Array.isArray(payload.entities) || payload.entities.length === 0)
    ) {
      showPartActionToast(
        "当前选中实体不支持识别，请选择线段/多段线/圆弧/圆",
        "warning",
      );
      return;
    }

    const analyzeResponse = await fetch(
      `/api/drawing/files/${scope.fileId}/part-recognition/analyze${testParams}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!analyzeResponse.ok) {
      showPartActionToast("识别分析失败", "error");
      return;
    }
    const analyze = await analyzeResponse.json();
    if (analyze?.inspection) {
      setInspectionResult(analyze.inspection as InspectionResult);
      setInspectionCoordinateSpace(
        analyze.coordinateSpace === "world" ? "world" : "local",
      );
    }

    const recognizeResponse = await fetch(
      `/api/drawing/files/${scope.fileId}/part-recognition/recognize${testParams}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          skipIfHasIssues: true,
        }),
      },
    );
    if (!recognizeResponse.ok) {
      showPartActionToast("识别零件失败", "error");
      return;
    }
    const recognize = await recognizeResponse.json();

    await refreshPrtsFileList();
    await refreshFileEntities(scope.fileId);
    applyRecognizedPartMappings(
      scope.fileId,
      Array.isArray(recognize.recognized) ? recognize.recognized : [],
    );

    if (Array.isArray(recognize.recognized) && recognize.recognized.length > 0) {
      showPartActionToast(`识别完成：生成 ${recognize.recognized.length} 个零件`, "success");
      return;
    }

    const skipped = Array.isArray(recognize.skippedGroups)
      ? recognize.skippedGroups.length
      : 0;
    const issueCount = Number(analyze?.inspection?.summary?.total ?? analyze?.summary?.totalIssues ?? 0);
    showPartActionToast(
      `未生成零件：${skipped > 0 ? `跳过 ${skipped} 组` : "存在检测问题"}（问题数 ${issueCount}）`,
      "error",
      3200,
    );
  }, [
    resolveScope,
    showPartActionToast,
    getTestModeParams,
    layoutEntities,
    setInspectionResult,
    setInspectionCoordinateSpace,
    refreshPrtsFileList,
    refreshFileEntities,
    applyRecognizedPartMappings,
  ]);

  const handleForceSetPart = useCallback(async () => {
    const scope = resolveScope();
    if (!scope) {
      showPartActionToast("请先选择DXF文件或实体", "warning");
      return;
    }

    const testParams = getTestModeParams();
    const payload = buildPartRecognitionPayload(scope, layoutEntities);
    if (
      scope.entityIds.length > 0 &&
      (!Array.isArray(payload.entities) || payload.entities.length === 0)
    ) {
      showPartActionToast(
        "当前选中实体不支持设为零件，请选择线段/多段线/圆弧/圆",
        "warning",
      );
      return;
    }

    const response = await fetch(
      `/api/drawing/files/${scope.fileId}/part-recognition/force-set${testParams}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      showPartActionToast("设为零件失败", "error");
      return;
    }

    const result = await response.json();
    await refreshPrtsFileList();
    await refreshFileEntities(scope.fileId);
    applyRecognizedPartMappings(
      scope.fileId,
      Array.isArray(result.created) ? result.created : [],
    );
    const createdCount = Array.isArray(result.created) ? result.created.length : 0;
    showPartActionToast(`设为零件完成：生成 ${createdCount} 个零件`, "success");
  }, [
    resolveScope,
    showPartActionToast,
    getTestModeParams,
    layoutEntities,
    refreshPrtsFileList,
    refreshFileEntities,
    applyRecognizedPartMappings,
  ]);

  const handleCancelPart = useCallback(async () => {
    const testParams = getTestModeParams();
    const selectedEntities = selectedEntityIds
      .map((entityId) => layoutEntities.find((entity) => entity.id === entityId))
      .filter((entity): entity is Entity => Boolean(entity && entity.fileId));

    let targetFileId: string | null = null;
    let targetPartIds: string[] = [];
    let targetEntityIds: string[] = [];
    if (selectedEntities.length > 0) {
      targetFileId = selectedEntities[0].fileId as string;
      targetEntityIds = selectedEntities.filter((entity) => entity.fileId === targetFileId).map((entity) => entity.id);
      const fromSelected = new Set<string>();
      selectedEntities.forEach((entity) => (entity.partIds ?? []).forEach((partId) => fromSelected.add(partId)));
      targetPartIds = Array.from(fromSelected);
    }

    if (!targetFileId || targetPartIds.length === 0) {
      showPartActionToast("当前没有可取消的零件", "warning");
      return;
    }

    const response = await fetch(`/api/drawing/files/${targetFileId}/part-recognition/unset${testParams}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partIds: targetPartIds,
        entityIds: targetEntityIds,
      }),
    });
    if (!response.ok) {
      showPartActionToast("取消零件失败", "error");
      return;
    }

    const result = await response.json();
    const removedPartIds = Array.isArray(result.removedPartIds) ? result.removedPartIds : [];
    const removedCount = removedPartIds.length;
    await refreshPrtsFileList();
    await refreshFileEntities(targetFileId);
    removeRecognizedPartMappings(targetFileId, removedPartIds);
    setSelectedEntityIds([]);
    showPartActionToast(`取消完成：恢复 ${removedCount} 个零件为图形`, "success");
  }, [
    getTestModeParams,
    selectedEntityIds,
    layoutEntities,
    showPartActionToast,
    refreshPrtsFileList,
    refreshFileEntities,
    removeRecognizedPartMappings,
    setSelectedEntityIds,
  ]);

  return {
    handleIdentifyPart,
    handleForceSetPart,
    handleCancelPart,
  };
}
