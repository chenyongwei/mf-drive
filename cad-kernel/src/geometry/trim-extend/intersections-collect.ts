import type {
  ArcGeometry,
  BoundaryGeometry,
  LineGeometry,
  TrimExtendEntityLike,
  TrimExtendPoint,
} from "./types";
import { TRIM_EXTEND_EPS } from "./types";
import {
  isAngleOnArc,
  parseBoundaryGeometry,
  parseTargetGeometry,
} from "./geometry";
import {
  circleCircleIntersections,
  dedupePoints,
  lineCircleIntersections,
  lineSegmentIntersection,
} from "./intersections-core";

export function collectLineBoundaryIntersections(
  line: LineGeometry,
  boundary: BoundaryGeometry,
  eps: number,
): TrimExtendPoint[] {
  const targetSegment = { start: line.start, end: line.end };
  const points: TrimExtendPoint[] = [];

  if (boundary.kind === "line") {
    const point = lineSegmentIntersection(targetSegment, boundary.line, eps);
    if (point) {
      points.push(point);
    }
    return dedupePoints(points, eps);
  }

  if (boundary.kind === "polyline") {
    boundary.segments.forEach((segment) => {
      const point = lineSegmentIntersection(targetSegment, segment, eps);
      if (point) {
        points.push(point);
      }
    });
    return dedupePoints(points, eps);
  }

  lineCircleIntersections(targetSegment, boundary.arc, eps).forEach((candidate) => {
    if (candidate.t < -eps || candidate.t > 1 + eps) {
      return;
    }
    if (!boundary.arc.isCircle) {
      const angle = Math.atan2(
        candidate.point.y - boundary.arc.center.y,
        candidate.point.x - boundary.arc.center.x,
      );
      if (!isAngleOnArc(angle, boundary.arc, eps)) {
        return;
      }
    }
    points.push(candidate.point);
  });

  return dedupePoints(points, eps);
}

export function collectArcBoundaryIntersections(
  arc: ArcGeometry,
  boundary: BoundaryGeometry,
  eps: number,
): TrimExtendPoint[] {
  const points: TrimExtendPoint[] = [];
  if (boundary.kind === "line") {
    lineCircleIntersections(boundary.line, arc, eps).forEach((candidate) => {
      if (candidate.t < -eps || candidate.t > 1 + eps) {
        return;
      }
      const angle = Math.atan2(
        candidate.point.y - arc.center.y,
        candidate.point.x - arc.center.x,
      );
      if (!isAngleOnArc(angle, arc, eps)) {
        return;
      }
      points.push(candidate.point);
    });
    return dedupePoints(points, eps);
  }

  if (boundary.kind === "polyline") {
    boundary.segments.forEach((segment) => {
      lineCircleIntersections(segment, arc, eps).forEach((candidate) => {
        if (candidate.t < -eps || candidate.t > 1 + eps) {
          return;
        }
        const angle = Math.atan2(
          candidate.point.y - arc.center.y,
          candidate.point.x - arc.center.x,
        );
        if (!isAngleOnArc(angle, arc, eps)) {
          return;
        }
        points.push(candidate.point);
      });
    });
    return dedupePoints(points, eps);
  }

  circleCircleIntersections(arc, boundary.arc, eps).forEach((point) => {
    const targetAngle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
    if (!isAngleOnArc(targetAngle, arc, eps)) {
      return;
    }
    if (!boundary.arc.isCircle) {
      const boundaryAngle = Math.atan2(
        point.y - boundary.arc.center.y,
        point.x - boundary.arc.center.x,
      );
      if (!isAngleOnArc(boundaryAngle, boundary.arc, eps)) {
        return;
      }
    }
    points.push(point);
  });

  return dedupePoints(points, eps);
}

export function collectIntersections(
  target: TrimExtendEntityLike,
  boundary: TrimExtendEntityLike,
  options: { eps?: number } = {},
): TrimExtendPoint[] {
  const eps = options.eps ?? TRIM_EXTEND_EPS;
  const targetGeometry = parseTargetGeometry(target, eps);
  const boundaryGeometry = parseBoundaryGeometry(boundary, eps);
  if (!targetGeometry || !boundaryGeometry) {
    return [];
  }

  if (targetGeometry.kind === "line") {
    return collectLineBoundaryIntersections(targetGeometry.line, boundaryGeometry, eps);
  }
  return collectArcBoundaryIntersections(targetGeometry.arc, boundaryGeometry, eps);
}
