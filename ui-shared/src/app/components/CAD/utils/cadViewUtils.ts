import { Entity } from '../../../lib/webgpu/EntityToVertices';
import { isPointInPart } from '../../../utils/geometryUtils';
import { transformEntity, translateEntity } from '../../../utils/entityTransform';
import { NestingPart, Point } from '../types/NestingTypes';
import type { Transformation } from '@dxf-fix/shared/utils/geometry';
import type { ToolpathOverlaySegment } from '../types/CADCanvasTypes';

export interface DragPreview {
  partId: string;
  position: { x: number; y: number };
  isValid: boolean;
}

function hasPartEntities(part: NestingPart): boolean {
  return Array.isArray(part.entities) && part.entities.length > 0;
}

function buildPartTransformations(part: NestingPart): Transformation[] {
  const transformations: Transformation[] = [];
  const bbox = part.boundingBox;
  const pivot = {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };

  if (part.mirroredX || part.mirroredY) {
    transformations.push({
      type: 'scale',
      scale: {
        sx: part.mirroredX ? -1 : 1,
        sy: part.mirroredY ? -1 : 1,
      },
      origin: pivot,
    });
  }

  const rotation = Number(part.rotation ?? 0);
  if (Number.isFinite(rotation) && rotation !== 0) {
    transformations.push({
      type: 'rotate',
      rotation: {
        angle: (rotation * Math.PI) / 180,
        origin: pivot,
      },
    });
  }

  const position = part.position ?? { x: 0, y: 0 };
  const dx = Number.isFinite(position.x) ? position.x : 0;
  const dy = Number.isFinite(position.y) ? position.y : 0;
  if (dx !== 0 || dy !== 0) {
    transformations.push({
      type: 'translate',
      translation: { dx, dy },
    });
  }

  return transformations;
}

export function rebuildNestingEntitiesFromParts(
  entities: Entity[],
  parts: NestingPart[],
): Entity[] {
  const partEntityIds = new Set<string>();
  const transformedPartEntities: Entity[] = [];

  for (const part of parts) {
    if (!hasPartEntities(part)) continue;
    const transformations = buildPartTransformations(part);
    for (const entity of part.entities) {
      if (typeof entity.id === "string" && entity.id.length > 0) {
        partEntityIds.add(entity.id);
      }
      transformedPartEntities.push(
        transformations.length > 0 ? transformEntity(entity, transformations) : entity,
      );
    }
  }

  if (transformedPartEntities.length === 0) {
    return entities;
  }

  const nonPartEntities = entities.filter((entity) => !partEntityIds.has(entity.id));
  return [...nonPartEntities, ...transformedPartEntities];
}

export function getEffectiveEntities(
  entities: Entity[],
  draggedEntityInfo: { id: string; offset: { x: number; y: number } } | null | undefined,
  isNestingMode: boolean,
  dragPreview: DragPreview | null,
  parts: NestingPart[],
): Entity[] {
  if (isNestingMode && parts.length > 0) {
    const partsWithPreview = dragPreview
      ? mergePartsWithDragPreview(parts, dragPreview)
      : parts;
    if (partsWithPreview.some(hasPartEntities)) {
      const worldEntityIds = new Set(entities.map((entity) => entity.id));
      const hasOverlap = partsWithPreview.some((part) =>
        part.entities.some((entity) => worldEntityIds.has(entity.id)),
      );
      if (hasOverlap) {
        return rebuildNestingEntitiesFromParts(entities, partsWithPreview);
      }
    }
  }

  if (isNestingMode && dragPreview) {
    const targetPart = parts.find((p) => p.id === dragPreview.partId);
    if (targetPart) {
      const dx = dragPreview.position.x - targetPart.position.x;
      const dy = dragPreview.position.y - targetPart.position.y;
      if (dx === 0 && dy === 0) return entities;

      const relatedFileIds = new Set<string>();
      const targetPartEntityIds = new Set<string>();
      if (Array.isArray(targetPart.entities)) {
        targetPart.entities.forEach((entity) => {
          if (typeof entity.id === "string" && entity.id.length > 0) {
            targetPartEntityIds.add(entity.id);
          }
          if (typeof entity.fileId === "string" && entity.fileId.length > 0) {
            relatedFileIds.add(entity.fileId);
          }
        });
      }

      return entities.map((entity) => {
        const hasPartMatch =
          Array.isArray(entity.partIds) &&
          entity.partIds.some((partId) => partId === dragPreview.partId);
        const hasEntityIdMatch = targetPartEntityIds.has(entity.id);
        const hasFileMatch =
          (typeof entity.fileId === "string" &&
            (entity.fileId === dragPreview.partId || relatedFileIds.has(entity.fileId))) ||
          entity.id.startsWith(`${dragPreview.partId}-`);
        return hasPartMatch || hasEntityIdMatch || hasFileMatch
          ? translateEntity(entity, dx, dy)
          : entity;
      });
    }
  }

  if (!draggedEntityInfo) return entities;
  return entities.map((e) =>
    e.id === draggedEntityInfo.id
      ? translateEntity(e, draggedEntityInfo.offset.x, draggedEntityInfo.offset.y)
      : e,
  );
}

export function mergePartsWithDragPreview(parts: NestingPart[], dragPreview: DragPreview | null): NestingPart[] {
  if (!dragPreview) return parts;
  return parts.map((part) =>
    part.id === dragPreview.partId ? { ...part, position: dragPreview.position } : part,
  );
}

function isToolpathSegmentOwnedByPart(
  segment: ToolpathOverlaySegment,
  partId: string,
): boolean {
  if (typeof segment.partId === "string" && segment.partId === partId) {
    return true;
  }
  return (
    typeof segment.contourId === "string" &&
    segment.contourId.startsWith(`${partId}-`)
  );
}

export function getEffectiveToolpathOverlaySegments(
  segments: ToolpathOverlaySegment[],
  dragPreview: DragPreview | null,
  parts: NestingPart[],
): ToolpathOverlaySegment[] {
  if (!dragPreview || segments.length === 0) return segments;

  const currentPart = parts.find((part) => part.id === dragPreview.partId);
  if (!currentPart) return segments;

  const dx = dragPreview.position.x - currentPart.position.x;
  const dy = dragPreview.position.y - currentPart.position.y;
  if (dx === 0 && dy === 0) return segments;

  let translatedChanged = false;
  const translated = segments.map((segment) => {
    if (!isToolpathSegmentOwnedByPart(segment, dragPreview.partId)) {
      return segment;
    }
    translatedChanged = true;
    return {
      ...segment,
      from: {
        x: segment.from.x + dx,
        y: segment.from.y + dy,
      },
      to: {
        x: segment.to.x + dx,
        y: segment.to.y + dy,
      },
    };
  });

  const blockStartPoints = translated
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment, index }) =>
      segment.kind !== "RAPID" &&
      (index === 0 || translated[index - 1].kind === "RAPID"),
    )
    .map(({ segment }) => segment.from);

  if (blockStartPoints.length === 0) {
    return translatedChanged ? translated : segments;
  }

  let nextBlockStartIndex = 0;
  let cursor = translated[0]?.from ?? { x: 0, y: 0 };
  let rapidChanged = false;

  const withConnectedRapid = translated.map((segment, index) => {
    if (segment.kind !== "RAPID") {
      if (index === 0 || translated[index - 1].kind === "RAPID") {
        nextBlockStartIndex += 1;
      }
      cursor = segment.to;
      return segment;
    }

    const targetPoint =
      blockStartPoints[nextBlockStartIndex] ?? segment.to;
    const nextRapidSegment: ToolpathOverlaySegment = {
      ...segment,
      from: { x: cursor.x, y: cursor.y },
      to: { x: targetPoint.x, y: targetPoint.y },
    };
    if (
      nextRapidSegment.from.x !== segment.from.x ||
      nextRapidSegment.from.y !== segment.from.y ||
      nextRapidSegment.to.x !== segment.to.x ||
      nextRapidSegment.to.y !== segment.to.y
    ) {
      rapidChanged = true;
    }
    cursor = nextRapidSegment.to;
    return nextRapidSegment;
  });

  if (!translatedChanged && !rapidChanged) {
    return segments;
  }
  return withConnectedRapid;
}

export function toPartLocalPoint(part: NestingPart, x: number, y: number): Point {
  let localX = x - part.position.x;
  let localY = y - part.position.y;

  if (part.rotation !== 0) {
    const centerX = (part.boundingBox.minX + part.boundingBox.maxX) / 2;
    const centerY = (part.boundingBox.minY + part.boundingBox.maxY) / 2;
    const rad = (-part.rotation * Math.PI) / 180;
    const tx = localX - centerX;
    const ty = localY - centerY;
    localX = tx * Math.cos(rad) - ty * Math.sin(rad) + centerX;
    localY = tx * Math.sin(rad) + ty * Math.cos(rad) + centerY;
  }

  if (part.mirroredX) {
    const centerX = (part.boundingBox.minX + part.boundingBox.maxX) / 2;
    localX = centerX - (localX - centerX);
  }
  if (part.mirroredY) {
    const centerY = (part.boundingBox.minY + part.boundingBox.maxY) / 2;
    localY = centerY - (localY - centerY);
  }

  return { x: localX, y: localY };
}

export function findPartAtPosition(parts: NestingPart[], x: number, y: number): string | null {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    const { x: localX, y: localY } = toPartLocalPoint(part, x, y);

    const inBBox =
      localX >= part.boundingBox.minX &&
      localX <= part.boundingBox.maxX &&
      localY >= part.boundingBox.minY &&
      localY <= part.boundingBox.maxY;

    if (inBBox && isPointInPart(localX, localY, part.entities)) return part.id;
  }
  return null;
}

export function getPartDragPreviewOffset(
  dragPreview: DragPreview | null,
  parts: NestingPart[],
): { partId: string; offset: { x: number; y: number } } | undefined {
  if (!dragPreview) return undefined;
  const current = parts.find((p) => p.id === dragPreview.partId);
  return {
    partId: dragPreview.partId,
    offset: {
      x: dragPreview.position.x - (current?.position.x ?? 0),
      y: dragPreview.position.y - (current?.position.y ?? 0),
    },
  };
}
