import { useCallback } from "react";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { isExplodableType } from "../../../../shared/cad/explodeKernel";
import {
  toContourPoints,
  toPoint2D,
  toRecord,
  uniquePoints,
  type Point2D,
} from "../CADPageLayout.file-utils";

interface UseCadExplodeActionOptions {
  selectedEntityIds: string[];
  layoutEntities: Entity[];
  fileLayouts: Array<{ fileId: string; offsetX: number; offsetY: number }>;
  entitiesMap: Record<string, Entity[]>;
  executeExplode: (fileId: string, entityId: string) => Promise<any>;
  setSelectedEntityIds: (value: string[]) => void;
  setExplodeAnimationPoints: (points: Array<{ x: number; y: number }> | null) => void;
  showPartActionToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    durationMs?: number,
  ) => void;
}

function resolveExplodeFailureMessage(message?: string): string {
  const normalized = String(message ?? "").trim();
  if (normalized.length === 0) return "炸开失败，请重试";
  if (/no explodable intersections found/i.test(normalized)) return "未找到可炸开的交点";
  if (/no intersection/i.test(normalized)) return "未找到可炸开的交点";
  if (/entity not found/i.test(normalized)) return "目标对象不存在，请重新选择";
  if (/please select one object to explode/i.test(normalized)) return "请选择要炸开的图形对象";
  if (/only .* can explode|only polylines can be exploded/i.test(normalized)) return "当前对象类型不支持炸开";
  return normalized;
}

export function useCadExplodeAction({
  selectedEntityIds,
  layoutEntities,
  fileLayouts,
  entitiesMap,
  executeExplode,
  setSelectedEntityIds,
  setExplodeAnimationPoints,
  showPartActionToast,
}: UseCadExplodeActionOptions) {
  return useCallback(
    async (overrideEntityIds?: string[]) => {
      const effectiveEntityIds =
        overrideEntityIds && overrideEntityIds.length > 0 ? overrideEntityIds : selectedEntityIds;
      if (effectiveEntityIds.length === 0) {
        showPartActionToast("请选择要炸开的图形对象", "warning");
        return;
      }

      const selectedEntities = effectiveEntityIds
        .map((entityId) => layoutEntities.find((candidate) => candidate.id === entityId))
        .filter((candidate): candidate is Entity => Boolean(candidate?.fileId))
        .filter((candidate) => !candidate.isPart && (!Array.isArray(candidate.partIds) || candidate.partIds.length === 0));
      const explodeTargets = selectedEntities.filter((entity) => isExplodableType(entity.type));
      if (explodeTargets.length === 0) {
        showPartActionToast("当前选中对象不支持炸开", "warning");
        return;
      }

      const extractAnchorPoint = (candidate: Entity): Point2D | null => {
        const geometry = toRecord(candidate.geometry);
        return toPoint2D(geometry?.start) || toPoint2D(geometry?.center) || toContourPoints(geometry?.points)[0] || null;
      };
      const withAnimationOffset = (points: Array<{ x: number; y: number }>, offset: Point2D) =>
        points.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y }));
      const collectFromResponse = (response: Record<string, unknown>) =>
        uniquePoints(
          (Array.isArray(response.animationPoints) ? response.animationPoints : [])
            .map((point) => toPoint2D(point))
            .filter((point): point is Point2D => Boolean(point))
            .map((point) => ({ x: point.x, y: point.y })),
        );
      const collectFromEntities = (candidates: Array<Record<string, unknown>>) => {
        const points: Array<{ x: number; y: number }> = [];
        candidates.forEach((candidate) => {
          if (String(candidate.type ?? "").toUpperCase() !== "LINE") return;
          const geometry = toRecord(candidate.geometry);
          const start = toPoint2D(geometry?.start);
          const end = toPoint2D(geometry?.end);
          if (start) points.push({ x: start.x, y: start.y });
          if (end) points.push({ x: end.x, y: end.y });
        });
        return uniquePoints(points);
      };

      let successCount = 0;
      const mergedAnimationPoints: Array<{ x: number; y: number }> = [];
      const failureMessages: string[] = [];

      for (const entity of explodeTargets) {
        const entityId = entity.id;
        const fileId = entity.fileId!;
        const fileEntities = entitiesMap[fileId] || layoutEntities.filter((candidate) => candidate.fileId === fileId);
        const localSourceEntity = fileEntities.find((candidate) => candidate.id === entityId) ?? entity;
        const displayedEntity = layoutEntities.find((candidate) => candidate.id === entityId);
        const sourceAnchor = extractAnchorPoint(localSourceEntity);
        const displayedAnchor = displayedEntity ? extractAnchorPoint(displayedEntity) : null;
        const layoutInfo = fileLayouts.find((candidate) => candidate.fileId === fileId);
        const offset =
          sourceAnchor && displayedAnchor
            ? { x: displayedAnchor.x - sourceAnchor.x, y: displayedAnchor.y - sourceAnchor.y }
            : { x: layoutInfo?.offsetX ?? 0, y: layoutInfo?.offsetY ?? 0 };

        const response = await executeExplode(fileId, entityId);
        if (!response) continue;
        const updatedEntities = Array.isArray(response.updatedEntities) ? response.updatedEntities : [];
        if (response.success) {
          successCount += 1;
          const responseRecord = response && typeof response === "object" ? (response as Record<string, unknown>) : {};
          const backendAnimationPoints = collectFromResponse(responseRecord);
          const entityAnimationPoints = collectFromEntities(updatedEntities as Array<Record<string, unknown>>);
          const sourcePoints = backendAnimationPoints.length > 0 ? backendAnimationPoints : entityAnimationPoints;
          mergedAnimationPoints.push(...withAnimationOffset(sourcePoints, offset));
        } else {
          failureMessages.push(resolveExplodeFailureMessage(String(response.message ?? "")));
        }
      }

      if (successCount > 0) {
        const animationPoints = uniquePoints(mergedAnimationPoints);
        if (animationPoints.length > 0) {
          setExplodeAnimationPoints(animationPoints);
          setTimeout(() => setExplodeAnimationPoints(null), 800);
        }
        setSelectedEntityIds([]);
        showPartActionToast("炸开成功", "success");
        return;
      }
      showPartActionToast(failureMessages[0] ?? "炸开失败，请重试", "error", 3200);
    },
    [
      selectedEntityIds,
      layoutEntities,
      fileLayouts,
      entitiesMap,
      executeExplode,
      setExplodeAnimationPoints,
      setSelectedEntityIds,
      showPartActionToast,
    ],
  );
}
