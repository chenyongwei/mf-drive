import type { Entity } from "../../lib/webgpu/EntityToVertices";
import type { FileData } from "./CADPageLayout.file-utils";

export interface DxfScope {
  fileId: string;
  entityIds: string[];
}

type Point2D = { x: number; y: number };

function toPoint(input: any): Point2D | null {
  const x = Number(input?.x);
  const y = Number(input?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

function buildArcPoints(
  center: Point2D,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number,
): Point2D[] {
  const normalizedSegments = Math.max(8, Math.min(256, Math.floor(segments)));
  const points: Point2D[] = [];
  for (let i = 0; i <= normalizedSegments; i += 1) {
    const t = i / normalizedSegments;
    const angle = startAngle + (endAngle - startAngle) * t;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

export function resolveDxfScopeForPartActions({
  selectedEntityIds,
  layoutEntities,
  files,
  selectedFileId,
  checkedFileIds,
}: {
  selectedEntityIds: string[];
  layoutEntities: Entity[];
  files: FileData[];
  selectedFileId: string | null;
  checkedFileIds: Set<string>;
}): DxfScope | null {
  const selectedEntities = selectedEntityIds
    .map((entityId) => layoutEntities.find((entity) => entity.id === entityId))
    .filter((entity): entity is Entity => Boolean(entity && entity.fileId));

  if (selectedEntities.length > 0) {
    const targetFileId = selectedEntities[0].fileId as string;
    const entityIds = selectedEntities
      .filter((entity) => entity.fileId === targetFileId)
      .map((entity) => entity.id);
    return {
      fileId: targetFileId,
      entityIds,
    };
  }

  const selectedDxf =
    files.find((file) => file.id === selectedFileId && file.type === "DXF") ||
    files.find((file) => file.type === "DXF" && checkedFileIds.has(file.id)) ||
    files.find((file) => file.type === "DXF");

  if (!selectedDxf) {
    return null;
  }

  return {
    fileId: selectedDxf.id,
    entityIds: [],
  };
}

export function buildPartRecognitionPayload(
  scope: DxfScope,
  layoutEntities: Entity[],
): Record<string, unknown> {
  const targetEntityIds =
    scope.entityIds.length > 0 ? new Set(scope.entityIds) : null;

  const scopedEntities = layoutEntities.filter((entity) => {
    if (entity.fileId !== scope.fileId) {
      return false;
    }
    if (!targetEntityIds) {
      return true;
    }
    return targetEntityIds.has(entity.id);
  });

  const requestEntities = scopedEntities
    .map((entity) => {
      const normalizedType = String(entity.type ?? "")
        .trim()
        .toUpperCase();
      if (normalizedType === "LINE") {
        const start = toPoint(entity.geometry?.start);
        const end = toPoint(entity.geometry?.end);
        if (!start || !end) {
          return null;
        }
        return {
          id: entity.id,
          fileId: String(entity.fileId ?? scope.fileId),
          type: "LINE" as const,
          isInnerContour: Boolean(entity.isInnerContour),
          geometry: {
            start,
            end,
          },
        };
      }

      if (normalizedType !== "POLYLINE" && normalizedType !== "LWPOLYLINE") {
        if (normalizedType === "CIRCLE") {
          const center = toPoint(entity.geometry?.center);
          const radius = Number(entity.geometry?.radius);
          if (!center || !Number.isFinite(radius) || radius <= 0) {
            return null;
          }
          const segments = Math.max(24, Math.ceil(radius * 0.6));
          const circlePoints = buildArcPoints(
            center,
            radius,
            0,
            2 * Math.PI,
            segments,
          );
          if (circlePoints.length < 3) {
            return null;
          }
          return {
            id: entity.id,
            fileId: String(entity.fileId ?? scope.fileId),
            type: "LWPOLYLINE" as const,
            isInnerContour: Boolean(entity.isInnerContour),
            geometry: {
              points: circlePoints,
              closed: true,
            },
          };
        }

        if (normalizedType === "ARC") {
          const center = toPoint(entity.geometry?.center);
          const radius = Number(entity.geometry?.radius);
          const startAngle = Number(entity.geometry?.startAngle ?? 0);
          let endAngle = Number(entity.geometry?.endAngle ?? 0);
          if (!center || !Number.isFinite(radius) || radius <= 0) {
            return null;
          }
          if (!Number.isFinite(startAngle) || !Number.isFinite(endAngle)) {
            return null;
          }
          if (endAngle <= startAngle) {
            endAngle += 2 * Math.PI;
          }
          const arcSpan = Math.max(0.0001, endAngle - startAngle);
          const segments = Math.max(8, Math.ceil((radius * arcSpan) / 10));
          const arcPoints = buildArcPoints(
            center,
            radius,
            startAngle,
            endAngle,
            segments,
          );
          if (arcPoints.length < 2) {
            return null;
          }
          return {
            id: entity.id,
            fileId: String(entity.fileId ?? scope.fileId),
            type: "LWPOLYLINE" as const,
            isInnerContour: Boolean(entity.isInnerContour),
            geometry: {
              points: arcPoints,
              closed: false,
            },
          };
        }

        return null;
      }

      const rawPoints: unknown[] = Array.isArray(entity.geometry?.points)
        ? (entity.geometry.points as unknown[])
        : [];
      const points = rawPoints
        .map((point) => toPoint(point))
        .filter((point): point is Point2D => point !== null);
      if (points.length < 2) {
        return null;
      }

      return {
        id: entity.id,
        fileId: String(entity.fileId ?? scope.fileId),
        type: normalizedType as "POLYLINE" | "LWPOLYLINE",
        isInnerContour: Boolean(entity.isInnerContour),
        geometry: {
          points,
          closed: Boolean(entity.geometry?.closed),
        },
      };
    })
    .filter((entity) => entity !== null);

  const payload: Record<string, unknown> = {};
  if (scope.entityIds.length > 0) {
    payload.entityIds = scope.entityIds;
  }
  if (requestEntities.length > 0) {
    payload.entities = requestEntities;
  }
  return payload;
}
