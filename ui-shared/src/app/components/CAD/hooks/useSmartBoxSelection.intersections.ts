import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { TWO_PI, type Point2D, type Rect, type ScreenBBox } from "./useSmartBoxSelection.types";
import {
  sampleCircleArcScreenPoints,
  sampleEllipseScreenPoints,
} from "./useSmartBoxSelection.sampling";

export function isEntityIntersecting(
  entity: Entity,
  rect: Rect,
  entityBBox: ScreenBBox | null,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): boolean {
  if (!entityBBox || !bboxIntersectsRect(entityBBox, rect)) {
    return false;
  }

  const geo = entity.geometry;
  if (!geo) {
    return false;
  }

  const type = (entity.type || "").toUpperCase();

  switch (type) {
    case "LINE": {
      const start = toScreenPoint(geo.start, worldToScreen);
      const end = toScreenPoint(geo.end, worldToScreen);
      if (!start || !end) {
        return true;
      }
      return segmentIntersectsRect(start, end, rect);
    }
    case "POLYLINE":
    case "LWPOLYLINE": {
      const points = toScreenPoints(geo.points, worldToScreen);
      if (points.length === 0) {
        return false;
      }
      const closed = Boolean(geo.closed || geo.isClosed);
      return polylineIntersectsRect(points, closed, rect);
    }
    case "SPLINE": {
      const points = toScreenPoints(
        geo.controlPoints && geo.controlPoints.length > 0
          ? geo.controlPoints
          : geo.points,
        worldToScreen,
      );
      if (points.length === 0) {
        return false;
      }
      const closed = Boolean(geo.closed || geo.isClosed);
      return polylineIntersectsRect(points, closed, rect);
    }
    case "CIRCLE":
    case "ARC": {
      if (!geo.center || typeof geo.radius !== "number") {
        return true;
      }
      const startAngle = type === "ARC" ? Number(geo.startAngle ?? 0) : 0;
      const endAngle = type === "ARC" ? Number(geo.endAngle ?? TWO_PI) : TWO_PI;
      const points = sampleCircleArcScreenPoints(
        geo.center,
        Number(geo.radius),
        startAngle,
        endAngle,
        worldToScreen,
      );
      if (points.length < 2) {
        return true;
      }
      return polylineIntersectsRect(points, type === "CIRCLE", rect);
    }
    case "ELLIPSE": {
      const sampled = sampleEllipseScreenPoints(geo, worldToScreen);
      if (!sampled || sampled.points.length < 2) {
        return true;
      }
      return polylineIntersectsRect(sampled.points, sampled.closed, rect);
    }
    default:
      return true;
  }
}

function bboxIntersectsRect(entityBBox: ScreenBBox, rect: Rect): boolean {
  return !(
    entityBBox.maxX < rect.x ||
    entityBBox.minX > rect.x + rect.width ||
    entityBBox.maxY < rect.y ||
    entityBBox.minY > rect.y + rect.height
  );
}

function pointInRect(point: Point2D, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function toScreenPoint(
  raw: unknown,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): Point2D | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const point = raw as { x?: unknown; y?: unknown };
  if (typeof point.x !== "number" || typeof point.y !== "number") {
    return null;
  }
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }
  return worldToScreen(point.x, point.y);
}

function toScreenPoints(
  rawPoints: unknown,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): Point2D[] {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  const points: Point2D[] = [];
  rawPoints.forEach((raw) => {
    const point = toScreenPoint(raw, worldToScreen);
    if (point) {
      points.push(point);
    }
  });
  return points;
}

function orientation(p: Point2D, q: Point2D, r: Point2D): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-9) {
    return 0;
  }
  return val > 0 ? 1 : 2;
}

function onSegment(p: Point2D, q: Point2D, r: Point2D): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

function segmentsIntersect(
  p1: Point2D,
  q1: Point2D,
  p2: Point2D,
  q2: Point2D,
): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(p1, p2, q1)) {
    return true;
  }
  if (o2 === 0 && onSegment(p1, q2, q1)) {
    return true;
  }
  if (o3 === 0 && onSegment(p2, p1, q2)) {
    return true;
  }
  if (o4 === 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false;
}

function segmentIntersectsRect(start: Point2D, end: Point2D, rect: Rect): boolean {
  if (pointInRect(start, rect) || pointInRect(end, rect)) {
    return true;
  }

  const topLeft: Point2D = { x: rect.x, y: rect.y };
  const topRight: Point2D = { x: rect.x + rect.width, y: rect.y };
  const bottomRight: Point2D = {
    x: rect.x + rect.width,
    y: rect.y + rect.height,
  };
  const bottomLeft: Point2D = { x: rect.x, y: rect.y + rect.height };

  return (
    segmentsIntersect(start, end, topLeft, topRight) ||
    segmentsIntersect(start, end, topRight, bottomRight) ||
    segmentsIntersect(start, end, bottomRight, bottomLeft) ||
    segmentsIntersect(start, end, bottomLeft, topLeft)
  );
}

function polylineIntersectsRect(
  points: Point2D[],
  closed: boolean,
  rect: Rect,
): boolean {
  if (points.length === 0) {
    return false;
  }
  if (points.length === 1) {
    return pointInRect(points[0], rect);
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    if (segmentIntersectsRect(points[i], points[i + 1], rect)) {
      return true;
    }
  }

  if (closed && points.length > 2) {
    if (segmentIntersectsRect(points[points.length - 1], points[0], rect)) {
      return true;
    }
  }

  return false;
}
