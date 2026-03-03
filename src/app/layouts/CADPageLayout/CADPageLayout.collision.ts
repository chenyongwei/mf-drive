import type { Entity } from "../../lib/webgpu/EntityToVertices";
import type { BoundingBox } from "../../components/CAD/types/BoundingBox";
import type { Point as EnginePoint } from "../../lib/webgpu/CollisionDetectionEngine";
import {
  toContourPoints,
  toFiniteNumber,
  toPoint2D,
  toRecord,
  type Point2D,
} from "./CADPageLayout.file-utils";

type CollisionContourCandidate = {
  points: EnginePoint[];
  flaggedInner: boolean;
};

export type CollisionContourData = {
  outer: EnginePoint[];
  inners: EnginePoint[][];
};

const COLLISION_CONTOUR_TOLERANCE = 1e-3;
const CIRCLE_CONTOUR_SEGMENTS = 48;

function pointsClose(
  a: Point2D,
  b: Point2D,
  tolerance = COLLISION_CONTOUR_TOLERANCE,
): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function normalizeContourLoop(points: Point2D[]): EnginePoint[] {
  if (points.length < 3) return [];
  const normalized = [...points];
  if (
    normalized.length >= 2 &&
    pointsClose(normalized[0], normalized[normalized.length - 1])
  ) {
    normalized.pop();
  }
  return normalized.length >= 3
    ? normalized.map((point) => ({ x: point.x, y: point.y }))
    : [];
}

function contourFromCircle(center: Point2D, radius: number): EnginePoint[] {
  const points: EnginePoint[] = [];
  for (let index = 0; index < CIRCLE_CONTOUR_SEGMENTS; index += 1) {
    const angle = (index / CIRCLE_CONTOUR_SEGMENTS) * Math.PI * 2;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

function contourCandidateFromEntity(entity: Entity): CollisionContourCandidate | null {
  const geometry = toRecord(entity.geometry);
  const type = String(entity.type ?? "").toUpperCase();
  const flaggedInner = Boolean(entity.isInnerContour);

  if (type === "LWPOLYLINE" || type === "POLYLINE" || type === "SPLINE") {
    const points = toContourPoints(geometry?.points);
    if (points.length < 3) return null;
    const closed =
      Boolean(geometry?.closed) ||
      (points.length >= 3 && pointsClose(points[0], points[points.length - 1]));
    if (!closed) return null;
    const normalized = normalizeContourLoop(points);
    if (normalized.length < 3) return null;
    return { points: normalized, flaggedInner };
  }

  if (type === "CIRCLE") {
    const center = toPoint2D(geometry?.center);
    const radius = toFiniteNumber(geometry?.radius);
    if (!center || radius === null || radius <= 0) return null;
    return { points: contourFromCircle(center, radius), flaggedInner };
  }

  return null;
}

function contourArea(points: EnginePoint[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2);
}

function pointOnSegment(point: EnginePoint, start: EnginePoint, end: EnginePoint): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > COLLISION_CONTOUR_TOLERANCE) {
    return false;
  }
  const dot = (point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y);
  if (dot < -COLLISION_CONTOUR_TOLERANCE) {
    return false;
  }
  const lenSq = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  return dot <= lenSq + COLLISION_CONTOUR_TOLERANCE;
}

function pointInContour(point: EnginePoint, contour: EnginePoint[]): boolean {
  let inside = false;
  const count = contour.length;
  for (let index = 0, previous = count - 1; index < count; previous = index++) {
    const a = contour[index];
    const b = contour[previous];
    if (pointOnSegment(point, a, b)) return true;
    const intersect =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function contourSamplePoint(points: EnginePoint[]): EnginePoint {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  points.forEach((point) => {
    sumX += point.x;
    sumY += point.y;
  });
  return { x: sumX / points.length, y: sumY / points.length };
}

function fallbackContourFromBoundingBox(bbox: BoundingBox): EnginePoint[] {
  return [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
  ];
}

export function buildCollisionContours(
  entities: Entity[],
  bbox: BoundingBox,
  simplifiedContour?: Point2D[],
): CollisionContourData {
  const candidates = entities
    .map((entity) => contourCandidateFromEntity(entity))
    .filter(
      (candidate): candidate is CollisionContourCandidate =>
        Boolean(candidate) && candidate.points.length >= 3,
    );

  if (
    candidates.length === 0 &&
    Array.isArray(simplifiedContour) &&
    simplifiedContour.length >= 3
  ) {
    const normalized = normalizeContourLoop(simplifiedContour);
    if (normalized.length >= 3) {
      candidates.push({ points: normalized, flaggedInner: false });
    }
  }

  if (candidates.length === 0) {
    return {
      outer: fallbackContourFromBoundingBox(bbox),
      inners: [],
    };
  }

  const pickLargest = (items: CollisionContourCandidate[]): CollisionContourCandidate => {
    return items.reduce((largest, current) =>
      contourArea(current.points) > contourArea(largest.points) ? current : largest,
    );
  };

  const explicitOuterCandidates = candidates.filter((candidate) => !candidate.flaggedInner);
  const outerCandidate = pickLargest(
    explicitOuterCandidates.length > 0 ? explicitOuterCandidates : candidates,
  );

  const outer = outerCandidate.points;
  const inners = candidates
    .filter((candidate) => candidate !== outerCandidate)
    .map((candidate) => candidate.points)
    .filter((points) => pointInContour(contourSamplePoint(points), outer));

  return { outer, inners };
}
