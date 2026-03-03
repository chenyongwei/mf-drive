import type { Transformation } from "@dxf-fix/shared/utils/geometry";
import { transformPoint } from "@dxf-fix/shared/utils/geometry";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";
import { transformEntity } from "../../../utils/entityTransform";
import {
  calculatePolygonArea,
  chainEntities,
  pointInPolygon,
} from "../../../utils/geometryUtils";
import type { NestingPart } from "../types/NestingTypes";

type Point = { x: number; y: number };

const CIRCLE_SEGMENTS = 48;
const ELLIPSE_SEGMENTS = 48;
const CONTOUR_TOLERANCE = 1e-3;

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPoint(value: unknown): Point | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { x?: unknown; y?: unknown };
  const x = toFiniteNumber(candidate.x);
  const y = toFiniteNumber(candidate.y);
  if (x === null || y === null) return null;
  return { x, y };
}

function toPoints(value: unknown): Point[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((point) => toPoint(point))
    .filter((point): point is Point => point !== null);
}

function pointsClose(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= CONTOUR_TOLERANCE && Math.abs(a.y - b.y) <= CONTOUR_TOLERANCE;
}

function normalizeClosedLoop(points: Point[]): Point[] {
  if (points.length < 3) return [];
  const normalized = [...points];
  if (pointsClose(normalized[0], normalized[normalized.length - 1])) {
    normalized.pop();
  }
  return normalized.length >= 3 ? normalized : [];
}

function normalizeAngleToRadians(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  return Math.abs(angle) > Math.PI * 2 + 1e-6 ? (angle * Math.PI) / 180 : angle;
}

function sampleCircle(center: Point, radius: number, segments = CIRCLE_SEGMENTS): Point[] {
  if (!Number.isFinite(radius) || radius <= 0) return [];
  const points: Point[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}

function sampleEllipse(
  center: Point,
  majorAxis: Point,
  ratio: number,
  startAngle: number,
  endAngle: number,
): Point[] {
  const radiusX = Math.hypot(majorAxis.x, majorAxis.y);
  if (!Number.isFinite(radiusX) || radiusX <= 0) return [];
  if (!Number.isFinite(ratio) || ratio <= 0) return [];

  let normalizedStart = normalizeAngleToRadians(startAngle);
  let normalizedEnd = normalizeAngleToRadians(endAngle);
  if (normalizedEnd <= normalizedStart) {
    normalizedEnd += Math.PI * 2;
  }
  const span = normalizedEnd - normalizedStart;
  const closed = Math.abs(span - Math.PI * 2) <= 1e-3;
  if (!closed) return [];

  const radiusY = radiusX * ratio;
  const rotation = Math.atan2(majorAxis.y, majorAxis.x);
  const segmentCount = Math.max(16, Math.ceil((span / (Math.PI * 2)) * ELLIPSE_SEGMENTS));
  const points: Point[] = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const t = index / segmentCount;
    const angle = normalizedStart + span * t;
    const localX = radiusX * Math.cos(angle);
    const localY = radiusY * Math.sin(angle);
    points.push({
      x: center.x + localX * Math.cos(rotation) - localY * Math.sin(rotation),
      y: center.y + localX * Math.sin(rotation) + localY * Math.cos(rotation),
    });
  }
  return points;
}

function buildPartTransformations(part: NestingPart): Transformation[] {
  const transformations: Transformation[] = [];
  const pivot = {
    x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
    y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
  };

  if (part.mirroredX || part.mirroredY) {
    transformations.push({
      type: "scale",
      scale: {
        sx: part.mirroredX ? -1 : 1,
        sy: part.mirroredY ? -1 : 1,
      },
      origin: pivot,
    });
  }

  if (part.rotation !== 0) {
    transformations.push({
      type: "rotate",
      rotation: {
        angle: (part.rotation * Math.PI) / 180,
        origin: pivot,
      },
    });
  }

  if (part.position.x !== 0 || part.position.y !== 0) {
    transformations.push({
      type: "translate",
      translation: { dx: part.position.x, dy: part.position.y },
    });
  }

  return transformations;
}

function extractDirectContours(entities: Entity[]): Point[][] {
  const contours: Point[][] = [];

  entities.forEach((entity) => {
    const type = String(entity.type ?? "").toUpperCase();
    const geometry = (entity.geometry ?? {}) as Record<string, unknown>;

    if (type === "CIRCLE") {
      const center = toPoint(geometry.center);
      const radius = toFiniteNumber(geometry.radius);
      if (!center || radius === null) return;
      const points = normalizeClosedLoop(sampleCircle(center, radius));
      if (points.length >= 3) contours.push(points);
      return;
    }

    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const points = toPoints(geometry.points);
      const closed =
        Boolean(geometry.closed) ||
        (points.length >= 3 && pointsClose(points[0], points[points.length - 1]));
      if (!closed) return;
      const normalized = normalizeClosedLoop(points);
      if (normalized.length >= 3) contours.push(normalized);
      return;
    }

    if (type === "SPLINE") {
      const points = toPoints(geometry.points ?? geometry.controlPoints);
      const closed =
        Boolean(geometry.closed) ||
        (points.length >= 3 && pointsClose(points[0], points[points.length - 1]));
      if (!closed) return;
      const normalized = normalizeClosedLoop(points);
      if (normalized.length >= 3) contours.push(normalized);
      return;
    }

    if (type === "ELLIPSE") {
      const center = toPoint(geometry.center);
      const majorAxis = toPoint(geometry.majorAxis ?? geometry.majorAxisEndPoint);
      const ratio = toFiniteNumber(geometry.ratio ?? geometry.minorAxisRatio ?? 1);
      const startAngle = toFiniteNumber(geometry.startAngle ?? 0);
      const endAngle = toFiniteNumber(geometry.endAngle ?? Math.PI * 2);
      if (!center || !majorAxis || ratio === null || startAngle === null || endAngle === null) return;
      const points = normalizeClosedLoop(
        sampleEllipse(center, majorAxis, ratio, startAngle, endAngle),
      );
      if (points.length >= 3) contours.push(points);
    }
  });

  return contours;
}

function extractChainedContours(entities: Entity[]): Point[][] {
  const chainable = entities.filter((entity) => {
    const type = String(entity.type ?? "").toUpperCase();
    if (type === "LINE" || type === "ARC") {
      return true;
    }
    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const points = toPoints((entity.geometry as Record<string, unknown>)?.points);
      const closed =
        Boolean((entity.geometry as Record<string, unknown>)?.closed) ||
        (points.length >= 3 && pointsClose(points[0], points[points.length - 1]));
      return !closed;
    }
    return false;
  });

  if (chainable.length === 0) return [];

  return chainEntities(chainable)
    .filter((contour) => contour.closed && contour.points.length >= 3)
    .map((contour) =>
      normalizeClosedLoop(
        contour.points.map((point) => ({ x: Number(point.x), y: Number(point.y) })),
      ),
    )
    .filter((points) => points.length >= 3);
}

function canonicalTokens(tokens: string[]): string {
  let best = "";
  for (let offset = 0; offset < tokens.length; offset += 1) {
    const rotated = [...tokens.slice(offset), ...tokens.slice(0, offset)].join("|");
    if (best.length === 0 || rotated < best) {
      best = rotated;
    }
  }
  return best;
}

function contourSignature(points: Point[]): string {
  const tokens = points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`);
  const forward = canonicalTokens(tokens);
  const reversed = canonicalTokens([...tokens].reverse());
  return forward < reversed ? forward : reversed;
}

function dedupeContours(contours: Point[][]): Point[][] {
  const unique = new Map<string, Point[]>();
  contours.forEach((points) => {
    if (points.length < 3) return;
    const signature = contourSignature(points);
    if (!unique.has(signature)) {
      unique.set(signature, points);
    }
  });
  return Array.from(unique.values());
}

function contourSamplePoint(points: Point[]): Point {
  let sumX = 0;
  let sumY = 0;
  points.forEach((point) => {
    sumX += point.x;
    sumY += point.y;
  });
  return { x: sumX / points.length, y: sumY / points.length };
}

function formatPathNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function contourToPath(points: Point[]): string {
  if (points.length < 3) return "";
  const first = points[0];
  const segments = points
    .slice(1)
    .map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`)
    .join(" ");
  return `M ${formatPathNumber(first.x)} ${formatPathNumber(first.y)} ${segments} Z`;
}

function fallbackBoundingBoxPath(part: NestingPart, transformations: Transformation[]): string {
  const corners: Point[] = [
    { x: part.boundingBox.minX, y: part.boundingBox.minY },
    { x: part.boundingBox.maxX, y: part.boundingBox.minY },
    { x: part.boundingBox.maxX, y: part.boundingBox.maxY },
    { x: part.boundingBox.minX, y: part.boundingBox.maxY },
  ];
  const transformed = transformations.length > 0
    ? corners.map((point) => transformPoint(point, transformations))
    : corners;
  return contourToPath(transformed);
}

export function buildPartHatchPath(part: NestingPart): string {
  if (!Array.isArray(part.entities) || part.entities.length === 0) {
    return fallbackBoundingBoxPath(part, buildPartTransformations(part));
  }

  const transformations = buildPartTransformations(part);
  const transformedEntities = transformations.length > 0
    ? part.entities.map((entity) => transformEntity(entity, transformations))
    : part.entities;

  const directContours = extractDirectContours(transformedEntities);
  const chainedContours = extractChainedContours(transformedEntities);
  const contours = dedupeContours([...directContours, ...chainedContours]);

  if (contours.length === 0) {
    return fallbackBoundingBoxPath(part, transformations);
  }

  const contoursWithDepth = contours.map((points) => {
    const samplePoint = contourSamplePoint(points);
    const depth = contours.reduce((count, candidate) => {
      if (candidate === points) return count;
      const candidateArea = Math.abs(calculatePolygonArea(candidate));
      const currentArea = Math.abs(calculatePolygonArea(points));
      if (candidateArea <= currentArea) return count;
      return pointInPolygon(samplePoint, candidate) ? count + 1 : count;
    }, 0);
    return {
      points,
      depth,
      area: Math.abs(calculatePolygonArea(points)),
    };
  });

  contoursWithDepth.sort((left, right) => {
    if (left.depth !== right.depth) return left.depth - right.depth;
    return right.area - left.area;
  });

  const path = contoursWithDepth
    .map((entry) => contourToPath(entry.points))
    .filter((segment) => segment.length > 0)
    .join(" ");

  return path.length > 0 ? path : fallbackBoundingBoxPath(part, transformations);
}
