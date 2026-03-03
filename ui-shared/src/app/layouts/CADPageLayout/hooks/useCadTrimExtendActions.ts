import { useCallback } from "react";
import type { EntityClickContext, SelectionChangeContext } from "../../../components/CAD/types/CADCanvasTypes";
import type { CADToolType } from "../../../components/CAD/CADToolPanel";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { getDrawingDocument } from "../../../services/drawingsApi";
import { graphicDocumentToEntities } from "../../../utils/graphicDocument";
import {
  distanceFromPointToEntity as calcDistanceFromPointToEntity,
  resolveTrimExtendFailureMessage as resolveTrimExtendFailureMessageUtil,
} from "../CADPageLayout.trim-extend-utils";
import type { Point2D } from "../CADPageLayout.file-utils";
import type { PendingCadAction, PendingTrimExtendState, TrimExtendTool } from "./useCadEditController";

interface UseCadTrimExtendActionsOptions {
  layoutEntities: Entity[];
  activeTool: CADToolType;
  pendingTrimExtend: PendingTrimExtendState | null;
  setPendingTrimExtend: (value: PendingTrimExtendState | null) => void;
  setPendingCadAction: (value: PendingCadAction | null) => void;
  setActiveTool: (value: CADToolType) => void;
  setSelectedEntityIds: (value: string[]) => void;
  selectedNonPartGraphicEntities: Entity[];
  selectedTrimExtendEntity: Entity | null;
  hasEditableGraphicEntities: boolean;
  resolveClickPoint: (entity: Entity, clickContext?: EntityClickContext) => Point2D;
  isTrimExtendEditableEntity: (entity: Entity) => boolean;
  executeTrim: (
    fileId: string,
    entityId: string,
    boundaryEntityId: string | undefined,
    clickPoint: Point2D,
  ) => Promise<any>;
  executeExtend: (
    fileId: string,
    entityId: string,
    boundaryEntityId: string | undefined,
    clickPoint: Point2D,
  ) => Promise<any>;
  refreshFileEntities: (fileId: string) => Promise<void>;
  fetchHistoryState: (fileId: string) => Promise<void>;
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    durationMs?: number,
  ) => void;
  handleDeleteKey: (overrideEntityIds?: string[]) => void;
  handleExplode: (overrideEntityIds?: string[]) => void;
}
export function useCadTrimExtendActions({
  layoutEntities,
  activeTool,
  pendingTrimExtend,
  setPendingTrimExtend,
  setPendingCadAction,
  setActiveTool,
  setSelectedEntityIds,
  selectedNonPartGraphicEntities,
  selectedTrimExtendEntity,
  hasEditableGraphicEntities,
  resolveClickPoint,
  isTrimExtendEditableEntity,
  executeTrim,
  executeExtend,
  refreshFileEntities,
  fetchHistoryState,
  showPartActionToast,
  handleDeleteKey,
  handleExplode,
}: UseCadTrimExtendActionsOptions) {
  const resolveBackendTargetEntityId = useCallback(
    async (fileId: string, targetEntityId: string, clickPoint: Point2D) => {
      try {
        const drawing = await getDrawingDocument(fileId);
        const entities = graphicDocumentToEntities(drawing.document);
        if (entities.some((entity) => String(entity.id ?? "") === targetEntityId)) {
          return targetEntityId;
        }
        const candidates = entities.filter((entity) => isTrimExtendEditableEntity(entity));
        if (candidates.length === 0) return null;
        candidates.sort(
          (left, right) =>
            calcDistanceFromPointToEntity(clickPoint, left) -
            calcDistanceFromPointToEntity(clickPoint, right),
        );
        const recoveredId = String(candidates[0]?.id ?? "");
        return recoveredId.length > 0 ? recoveredId : null;
      } catch {
        return null;
      }
    },
    [isTrimExtendEditableEntity],
  );
  const executeTrimExtendByTool = useCallback(
    async (input: {
      tool: TrimExtendTool;
      fileId: string;
      targetEntityId: string;
      clickPoint: Point2D;
      boundaryEntityId?: string;
    }) => {
      const runCommand = (entityId: string) =>
        input.tool === "trim"
          ? executeTrim(input.fileId, entityId, input.boundaryEntityId, input.clickPoint)
          : executeExtend(input.fileId, entityId, input.boundaryEntityId, input.clickPoint);

      let targetEntityId = input.targetEntityId;
      let response = await runCommand(targetEntityId);

      if (!response.success && response.errorCode === "TARGET_NOT_FOUND") {
        const recovered = await resolveBackendTargetEntityId(input.fileId, targetEntityId, input.clickPoint);
        await refreshFileEntities(input.fileId);
        if (recovered && recovered !== targetEntityId) {
          targetEntityId = recovered;
          response = await runCommand(targetEntityId);
        }
      }

      if (response.success) {
        await refreshFileEntities(input.fileId);
        await fetchHistoryState(input.fileId);
        setSelectedEntityIds([targetEntityId]);
        setPendingTrimExtend(null);
        showPartActionToast(input.tool === "trim" ? "修剪成功" : "延伸成功", "success");
        return;
      }

      const needsBoundary = !input.boundaryEntityId && (response.errorCode === "BOUNDARY_REQUIRED" || response.errorCode === "NO_INTERSECTION");
      if (needsBoundary) {
        setPendingTrimExtend({
          tool: input.tool,
          fileId: input.fileId,
          targetEntityId,
          clickPoint: input.clickPoint,
          stage: "await-boundary",
        });
        setSelectedEntityIds([targetEntityId]);
        showPartActionToast(response.errorCode === "NO_INTERSECTION" ? "未自动找到可用交点，请点击边界对象" : "请点击边界对象", "warning");
        return;
      }

      setPendingTrimExtend(null);
      showPartActionToast(
        resolveTrimExtendFailureMessageUtil({
          tool: input.tool,
          errorCode: response.errorCode,
          boundaryEntityId: input.boundaryEntityId,
          message: response.message,
        }),
        "error",
        3200,
      );
    },
    [
      executeTrim,
      executeExtend,
      resolveBackendTargetEntityId,
      refreshFileEntities,
      fetchHistoryState,
      setSelectedEntityIds,
      setPendingTrimExtend,
      showPartActionToast,
    ],
  );
  const executeTrimExtendForBoxSelection = useCallback(
    async (tool: TrimExtendTool, entityIds: string[]) => {
      const targets = entityIds
        .map((entityId) => layoutEntities.find((candidate) => candidate.id === entityId))
        .filter((candidate): candidate is Entity => Boolean(candidate?.fileId))
        .filter((candidate) => !candidate.isPart && (!Array.isArray(candidate.partIds) || candidate.partIds.length === 0))
        .filter((candidate) => isTrimExtendEditableEntity(candidate));
      if (targets.length === 0) {
        showPartActionToast("请选择线段或圆弧对象", "warning");
        return;
      }
      for (const target of targets) {
        await executeTrimExtendByTool({
          tool,
          fileId: String(target.fileId),
          targetEntityId: target.id,
          clickPoint: resolveClickPoint(target),
        });
      }
    },
    [layoutEntities, isTrimExtendEditableEntity, executeTrimExtendByTool, resolveClickPoint, showPartActionToast],
  );
  const handleSelectionChange = useCallback(
    (selectedIds: Set<string>, context?: SelectionChangeContext) => {
      const selectedIdList = Array.from(selectedIds);
      setSelectedEntityIds(selectedIdList);
      if (context?.source !== "box" || selectedIdList.length === 0) return;
      if (activeTool === "delete") return void handleDeleteKey(selectedIdList);
      if (activeTool === "explode") return void handleExplode(selectedIdList);
      if (activeTool === "trim" || activeTool === "extend") {
        void executeTrimExtendForBoxSelection(activeTool, selectedIdList);
      }
    },
    [activeTool, setSelectedEntityIds, handleDeleteKey, handleExplode, executeTrimExtendForBoxSelection],
  );
  const handleEntitySelect = useCallback(
    (entityId: string, clickContext?: EntityClickContext) => {
      const clicked = layoutEntities.find((entity) => entity.id === entityId);
      if (!clicked) return setSelectedEntityIds([entityId]);
      if (activeTool === "delete") {
        if (clicked.isPart || (Array.isArray(clicked.partIds) && clicked.partIds.length > 0)) return showPartActionToast("请选择可编辑图形对象", "warning");
        return void handleDeleteKey([clicked.id]);
      }
      if (activeTool === "explode") {
        if (clicked.isPart || (Array.isArray(clicked.partIds) && clicked.partIds.length > 0)) return showPartActionToast("请选择要炸开的图形对象", "warning");
        return void handleExplode([clicked.id]);
      }
      if (activeTool !== "trim" && activeTool !== "extend") return setSelectedEntityIds([entityId]);
      if (!clicked.fileId) return showPartActionToast("目标对象缺少文件归属，无法执行", "error");
      if (pendingTrimExtend?.stage === "await-boundary") {
        if (clicked.id === pendingTrimExtend.targetEntityId) return showPartActionToast("请点击边界对象，不能点击目标本身", "warning");
        if (String(clicked.fileId) !== pendingTrimExtend.fileId) return showPartActionToast("边界对象必须和目标在同一文件", "warning");
        return void executeTrimExtendByTool({
          tool: pendingTrimExtend.tool,
          fileId: pendingTrimExtend.fileId,
          targetEntityId: pendingTrimExtend.targetEntityId,
          clickPoint: pendingTrimExtend.clickPoint,
          boundaryEntityId: clicked.id,
        });
      }
      void executeTrimExtendByTool({
        tool: activeTool,
        fileId: String(clicked.fileId),
        targetEntityId: clicked.id,
        clickPoint: resolveClickPoint(clicked, clickContext),
      });
    },
    [layoutEntities, activeTool, setSelectedEntityIds, handleDeleteKey, handleExplode, pendingTrimExtend, executeTrimExtendByTool, resolveClickPoint, showPartActionToast],
  );
  const handleTrimToolAction = useCallback(() => {
    setPendingCadAction(null);
    setPendingTrimExtend(null);
    setActiveTool("trim");
    if (selectedTrimExtendEntity?.fileId) {
      void executeTrimExtendByTool({
        tool: "trim",
        fileId: String(selectedTrimExtendEntity.fileId),
        targetEntityId: selectedTrimExtendEntity.id,
        clickPoint: resolveClickPoint(selectedTrimExtendEntity),
      });
      return;
    }
    showPartActionToast("修剪：请选择目标对象", "info");
  }, [setPendingCadAction, setPendingTrimExtend, setActiveTool, selectedTrimExtendEntity, executeTrimExtendByTool, resolveClickPoint, showPartActionToast]);

  const handleExtendToolAction = useCallback(() => {
    setPendingCadAction(null);
    setPendingTrimExtend(null);
    setActiveTool("extend");
    if (selectedTrimExtendEntity?.fileId) {
      void executeTrimExtendByTool({
        tool: "extend",
        fileId: String(selectedTrimExtendEntity.fileId),
        targetEntityId: selectedTrimExtendEntity.id,
        clickPoint: resolveClickPoint(selectedTrimExtendEntity),
      });
      return;
    }
    showPartActionToast("延伸：请选择目标对象", "info");
  }, [setPendingCadAction, setPendingTrimExtend, setActiveTool, selectedTrimExtendEntity, executeTrimExtendByTool, resolveClickPoint, showPartActionToast]);

  const handleDeleteToolAction = useCallback(() => {
    setPendingTrimExtend(null);
    setPendingCadAction(null);
    setActiveTool("delete");
    const selectedIds = selectedNonPartGraphicEntities.map((entity) => entity.id);
    if (selectedIds.length > 0) return void handleDeleteKey(selectedIds);
    if (!hasEditableGraphicEntities) return showPartActionToast("当前没有可编辑图形", "warning");
    showPartActionToast("删除：请选择目标对象", "info");
  }, [setPendingTrimExtend, setPendingCadAction, setActiveTool, selectedNonPartGraphicEntities, handleDeleteKey, hasEditableGraphicEntities, showPartActionToast]);

  const handleExplodeToolAction = useCallback(() => {
    setPendingTrimExtend(null);
    setPendingCadAction(null);
    setActiveTool("explode");
    const selectedIds = selectedNonPartGraphicEntities.map((entity) => entity.id);
    if (selectedIds.length > 0) return void handleExplode(selectedIds);
    if (!hasEditableGraphicEntities) return showPartActionToast("当前没有可编辑图形", "warning");
    showPartActionToast("炸开：请选择目标对象", "info");
  }, [setPendingTrimExtend, setPendingCadAction, setActiveTool, selectedNonPartGraphicEntities, handleExplode, hasEditableGraphicEntities, showPartActionToast]);

  return {
    handleSelectionChange,
    handleEntitySelect,
    handleTrimToolAction,
    handleExtendToolAction,
    handleDeleteToolAction,
    handleExplodeToolAction,
  };
}
