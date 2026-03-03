import type {
  ExplodeEntityLike,
  ExplodePlan,
  ExplodePlanOptions,
  ExplodeSegmentPlan,
  LineSegment2D,
} from './explode.types';
import {
  collectEntitySegments,
  distanceBetweenPoints,
  extractArcGeometry,
  extractLineSegment,
  isPointOnArc,
  isPointOnSegment,
  normalizeAngle,
  normalizeType,
  toPointArray,
  toRecord,
  uniqueNumbers,
  uniquePoints,
} from './explode.helpers';
import {
  collectSegmentSplitPoints,
  findCircleCircleIntersection,
  findLineCircleIntersection,
} from './explode.intersections';

function buildLineExplodePlan(
  sourceEntity: ExplodeEntityLike,
  fileEntities: ExplodeEntityLike[],
  tolerance: number,
): ExplodePlan | null {
  const targetSegment = extractLineSegment(sourceEntity, tolerance);
  if (!targetSegment) {
    return null;
  }

  const orderedPoints = collectSegmentSplitPoints(
    targetSegment,
    sourceEntity.id,
    fileEntities,
    tolerance,
  );
  const segments: ExplodeSegmentPlan[] = [];

  for (let index = 0; index < orderedPoints.length - 1; index += 1) {
    const start = orderedPoints[index];
    const end = orderedPoints[index + 1];
    if (distanceBetweenPoints(start, end) <= tolerance) {
      continue;
    }
    segments.push({
      type: 'LINE',
      geometry: {
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
      },
    });
  }

  if (segments.length <= 1) {
    return null;
  }
  return { segments, animationPoints: orderedPoints };
}

function buildCircleExplodePlan(
  sourceEntity: ExplodeEntityLike,
  fileEntities: ExplodeEntityLike[],
  tolerance: number,
): ExplodePlan | null {
  const targetArc = extractArcGeometry(sourceEntity);
  if (!targetArc || !targetArc.isCircle) {
    return null;
  }

  const intersectionPoints = fileEntities.flatMap((candidate) => {
    if (candidate.id === sourceEntity.id) {
      return [];
    }

    const lineIntersections = collectEntitySegments(candidate, tolerance).flatMap((segment) =>
      findLineCircleIntersection(segment, targetArc).filter((point) =>
        isPointOnSegment(point, segment, tolerance),
      ),
    );

    const arcCandidate = extractArcGeometry(candidate);
    if (!arcCandidate) {
      return lineIntersections;
    }

    const arcIntersections = findCircleCircleIntersection(targetArc, arcCandidate).filter((point) =>
      isPointOnArc(point, arcCandidate),
    );
    return [...lineIntersections, ...arcIntersections];
  });

  const dedupedPoints = uniquePoints(intersectionPoints, tolerance);
  if (dedupedPoints.length < 2) {
    return null;
  }

  const sortedAngles = uniqueNumbers(
    dedupedPoints.map((point) =>
      normalizeAngle(Math.atan2(point.y - targetArc.center.y, point.x - targetArc.center.x)),
    ),
  ).sort((a, b) => a - b);
  if (sortedAngles.length < 2) {
    return null;
  }

  const segments: ExplodeSegmentPlan[] = [];
  for (let index = 0; index < sortedAngles.length; index += 1) {
    const startAngle = sortedAngles[index];
    const nextAngle =
      index === sortedAngles.length - 1
        ? sortedAngles[0] + Math.PI * 2
        : sortedAngles[index + 1];
    if (nextAngle - startAngle <= 1e-6) {
      continue;
    }
    segments.push({
      type: 'ARC',
      geometry: {
        center: { ...targetArc.center },
        radius: targetArc.radius,
        startAngle,
        endAngle: nextAngle,
      },
    });
  }

  if (segments.length <= 1) {
    return null;
  }
  return { segments, animationPoints: dedupedPoints };
}

function buildPolylineExplodePlan(
  sourceEntity: ExplodeEntityLike,
  fileEntities: ExplodeEntityLike[],
  tolerance: number,
): ExplodePlan | null {
  const geometry = toRecord(sourceEntity.geometry);
  const points = toPointArray(geometry?.points);
  const isClosed = Boolean(geometry?.closed);
  if (points.length < 2) {
    return null;
  }

  const baseSegments: LineSegment2D[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (distanceBetweenPoints(start, end) > tolerance) {
      baseSegments.push({ start, end });
    }
  }
  if (
    isClosed &&
    points.length > 2 &&
    distanceBetweenPoints(points[points.length - 1], points[0]) > tolerance
  ) {
    baseSegments.push({ start: points[points.length - 1], end: points[0] });
  }

  const segments: ExplodeSegmentPlan[] = [];
  const animationPoints: { x: number; y: number }[] = [];
  baseSegments.forEach((segment) => {
    const orderedPoints = collectSegmentSplitPoints(segment, sourceEntity.id, fileEntities, tolerance);
    animationPoints.push(...orderedPoints);
    for (let index = 0; index < orderedPoints.length - 1; index += 1) {
      const start = orderedPoints[index];
      const end = orderedPoints[index + 1];
      if (distanceBetweenPoints(start, end) <= tolerance) {
        continue;
      }
      segments.push({
        type: 'LINE',
        geometry: {
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
        },
      });
    }
  });

  if (segments.length === 0) {
    return null;
  }
  return { segments, animationPoints: uniquePoints(animationPoints, tolerance) };
}

export function isExplodableType(type: unknown): boolean {
  const normalized = normalizeType(type);
  return (
    normalized === 'LINE' ||
    normalized === 'POLYLINE' ||
    normalized === 'LWPOLYLINE' ||
    normalized === 'CIRCLE'
  );
}

export function computeExplodePlan(
  sourceEntity: ExplodeEntityLike,
  fileEntities: ExplodeEntityLike[],
  options: ExplodePlanOptions = {},
): ExplodePlan | null {
  const tolerance = Number.isFinite(options.tolerance) ? Number(options.tolerance) : 1e-4;
  const type = normalizeType(sourceEntity.type);
  if (!type) {
    return null;
  }
  if (type === 'LINE') {
    return buildLineExplodePlan(sourceEntity, fileEntities, tolerance);
  }
  if (type === 'CIRCLE') {
    return buildCircleExplodePlan(sourceEntity, fileEntities, tolerance);
  }
  if (type === 'POLYLINE' || type === 'LWPOLYLINE') {
    return buildPolylineExplodePlan(sourceEntity, fileEntities, tolerance);
  }
  return null;
}
