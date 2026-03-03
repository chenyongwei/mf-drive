import type { BoundingBox, Contour, Entity, Point } from "../../../types/editing";
import { calculateBoundingBox as calculateEntitiesBBox } from "../../entity-bbox/aggregate";
import { polygonArea } from "../../../../shared/utils/geometry/polygon";
import {
  detectContours as detectContoursShared,
  extractVerticesFromLoop as extractVerticesFromLoopShared,
  filterNestedContours as filterNestedContoursShared,
  validateContour as validateContourShared,
} from "../../../../shared/utils/geometry/contour/detection";
import type {
  ContourDetectionResult as SharedContourDetectionResult,
  EntityGraph as SharedEntityGraph,
} from "../../../../shared/utils/geometry/contour/types";
import type { ContourDetectionResult, EntityGraph } from "./types";

function toSharedContour(contour: Contour): any {
  return {
    ...contour,
    entities: contour.entityIds,
    isOuter: false,
    direction: "CW",
    holes: [],
  };
}

function toAppContour(sharedContour: any): Contour {
  return {
    id: sharedContour.id,
    isClosed: Boolean(sharedContour.isClosed),
    vertices: (sharedContour.vertices ?? []) as Point[],
    entityIds: (sharedContour.entities ?? sharedContour.entityIds ?? []) as string[],
    bbox: sharedContour.bbox as BoundingBox,
    area: Number(sharedContour.area ?? 0),
    parentId: sharedContour.parentId,
    children: sharedContour.children,
  };
}

export function validateContour(loop: string[], graph: EntityGraph): boolean {
  return validateContourShared(loop, graph as SharedEntityGraph);
}

export function calculateBoundingBox(entities: Entity[]): BoundingBox {
  const bbox = calculateEntitiesBBox(entities as any[]);
  if (bbox) {
    return bbox;
  }
  return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

export function calculatePolygonArea(vertices: Point[]): number {
  return polygonArea(vertices as any);
}

export function extractVerticesFromLoop(loop: string[], graph: EntityGraph): Point[] {
  return extractVerticesFromLoopShared(loop, graph as SharedEntityGraph) as Point[];
}

export function filterNestedContours(contours: Contour[]): Contour[] {
  const filtered = filterNestedContoursShared(contours.map(toSharedContour));
  return filtered.map(toAppContour);
}

export function detectContours(entities: Entity[]): ContourDetectionResult {
  const result = detectContoursShared(entities as any) as SharedContourDetectionResult;
  const contours = result.contours.map(toAppContour);
  return {
    contours,
    numClosed: contours.filter((contour) => contour.isClosed).length,
    numOpen: contours.filter((contour) => !contour.isClosed).length,
  };
}
