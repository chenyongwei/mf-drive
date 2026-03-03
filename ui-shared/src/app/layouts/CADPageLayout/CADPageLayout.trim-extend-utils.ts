import type { EntityClickContext } from "../../components/CAD/types/CADCanvasTypes";
import type { Entity } from "../../lib/webgpu/EntityToVertices";
import { getEntityBBox } from "../../utils/entityBBox";
import {
  toContourPoints,
  toPoint2D,
  type Point2D,
} from "./CADPageLayout.file-utils";

interface FileLayoutLike {
  fileId: string;
  offsetX: number;
  offsetY: number;
}

export function resolveFallbackClickPoint(entity: Entity): Point2D {
  const geometryRecord =
    entity.geometry && typeof entity.geometry === "object"
      ? (entity.geometry as Record<string, unknown>)
      : null;
  const anchorFromStart = toPoint2D(geometryRecord?.start);
  if (anchorFromStart) return anchorFromStart;
  const anchorFromCenter = toPoint2D(geometryRecord?.center);
  if (anchorFromCenter) return anchorFromCenter;
  const contourPoints = toContourPoints(geometryRecord?.points);
  if (contourPoints.length > 0) {
    return contourPoints[0];
  }
  const bbox = getEntityBBox(entity);
  return {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };
}

export function toLocalFilePoint(
  fileLayouts: FileLayoutLike[],
  fileId: string | null | undefined,
  point: Point2D,
): Point2D {
  if (!fileId) {
    return point;
  }
  const layoutInfo = fileLayouts.find(
    (candidate) => candidate.fileId === fileId,
  );
  if (!layoutInfo) {
    return point;
  }
  return {
    x: point.x - layoutInfo.offsetX,
    y: point.y - layoutInfo.offsetY,
  };
}

export function resolveClickPoint(
  fileLayouts: FileLayoutLike[],
  entity: Entity,
  clickContext?: EntityClickContext,
): Point2D {
  const worldPoint = clickContext?.worldPoint;
  if (
    worldPoint &&
    Number.isFinite(worldPoint.x) &&
    Number.isFinite(worldPoint.y)
  ) {
    return toLocalFilePoint(fileLayouts, entity.fileId, {
      x: worldPoint.x,
      y: worldPoint.y,
    });
  }
  return toLocalFilePoint(
    fileLayouts,
    entity.fileId,
    resolveFallbackClickPoint(entity),
  );
}

export function isTrimExtendEditableEntity(entity: Entity): boolean {
  const normalizedType = String(entity.type ?? "").toUpperCase();
  return normalizedType === "LINE" || normalizedType === "ARC";
}

export function distanceFromPointToEntity(point: Point2D, entity: Entity): number {
  const bbox = getEntityBBox(entity);
  const nearestX = Math.max(bbox.minX, Math.min(point.x, bbox.maxX));
  const nearestY = Math.max(bbox.minY, Math.min(point.y, bbox.maxY));
  return Math.hypot(point.x - nearestX, point.y - nearestY);
}

export function resolveTrimExtendFailureMessage(input: {
  tool: "trim" | "extend";
  errorCode?: string;
  boundaryEntityId?: string;
  message?: string;
}): string {
  if (input.errorCode === "TARGET_NOT_FOUND") {
    return "目标对象不存在，请重新选择";
  }
  if (input.errorCode === "UNSUPPORTED_TARGET") {
    return "仅支持对线段或圆弧执行该操作";
  }
  if (input.errorCode === "UNSUPPORTED_BOUNDARY") {
    return "边界对象不受支持，请重新选择";
  }
  if (input.errorCode === "NO_INTERSECTION") {
    if (input.boundaryEntityId) {
      return "目标与边界没有可用交点，请重新选择边界";
    }
    return "未自动找到可用交点，请点击边界对象";
  }
  if (input.errorCode === "BOUNDARY_REQUIRED") {
    return "请点击边界对象";
  }

  const fallback = input.tool === "trim" ? "修剪失败，请重试" : "延伸失败，请重试";
  if (!input.message || input.message.trim().length === 0) {
    return fallback;
  }
  if (/entity not found/i.test(input.message)) {
    return "目标对象不存在，请重新选择";
  }
  if (/no intersection/i.test(input.message)) {
    return input.boundaryEntityId
      ? "目标与边界没有可用交点，请重新选择边界"
      : "未自动找到可用交点，请点击边界对象";
  }
  return input.message;
}
