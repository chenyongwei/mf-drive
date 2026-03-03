import {
  TRIM_EXTEND_EPS,
  TWO_PI,
  type ArcGeometry,
  type BoundaryGeometry,
  type ExtendArcCandidate,
  type ExtendLineCandidate,
  type LineGeometry,
  type TargetGeometry,
  type TrimExtendPoint,
} from "./types";
import {
  arcEndpoint,
  isAngleOnArc,
  normalizeAngle,
  pointDistance,
} from "./geometry";
import {
  rayCircleIntersections,
  raySegmentIntersection,
} from "./intersections-core";
import { collectArcBoundaryIntersections } from "./intersections-collect";

export function endpointToExtendForLine(
  line: LineGeometry,
  clickPoint: TrimExtendPoint,
): "start" | "end" {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= TRIM_EXTEND_EPS) {
    const startDistance = pointDistance(clickPoint, line.start);
    const endDistance = pointDistance(clickPoint, line.end);
    return startDistance <= endDistance ? "start" : "end";
  }

  const param =
    ((clickPoint.x - line.start.x) * dx + (clickPoint.y - line.start.y) * dy) /
    lengthSquared;
  return param <= 0.5 ? "start" : "end";
}

export function normalizeDirection(
  from: TrimExtendPoint,
  to: TrimExtendPoint,
): TrimExtendPoint | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= TRIM_EXTEND_EPS) {
    return null;
  }
  return { x: dx / length, y: dy / length };
}

export function collectLineExtendCandidates(
  line: LineGeometry,
  boundary: BoundaryGeometry,
  clickPoint: TrimExtendPoint,
  eps: number,
): ExtendLineCandidate[] {
  const preferredEndpoint = endpointToExtendForLine(line, clickPoint);
  const collectForEndpoint = (fromEndpoint: "start" | "end"): ExtendLineCandidate[] => {
    const origin = fromEndpoint === "start" ? line.start : line.end;
    const opposite = fromEndpoint === "start" ? line.end : line.start;
    const direction = normalizeDirection(opposite, origin);
    if (!direction) {
      return [];
    }

    const candidates: ExtendLineCandidate[] = [];
    const addCandidate = (point: TrimExtendPoint, distance: number) => {
      if (distance <= eps) {
        return;
      }
      candidates.push({
        intersection: point,
        fromEndpoint,
        extensionLength: distance,
      });
    };

    if (boundary.kind === "line") {
      const hit = raySegmentIntersection(origin, direction, boundary.line, eps);
      if (hit) {
        addCandidate(hit.point, hit.distance);
      }
    } else if (boundary.kind === "polyline") {
      boundary.segments.forEach((segment) => {
        const hit = raySegmentIntersection(origin, direction, segment, eps);
        if (hit) {
          addCandidate(hit.point, hit.distance);
        }
      });
    } else {
      rayCircleIntersections(origin, direction, boundary.arc, eps).forEach((hit) => {
        if (!boundary.arc.isCircle) {
          const angle = Math.atan2(
            hit.point.y - boundary.arc.center.y,
            hit.point.x - boundary.arc.center.x,
          );
          if (!isAngleOnArc(angle, boundary.arc, eps)) {
            return;
          }
        }
        addCandidate(hit.point, hit.distance);
      });
    }

    return candidates.sort((left, right) => left.extensionLength - right.extensionLength);
  };

  const preferredCandidates = collectForEndpoint(preferredEndpoint);
  if (preferredCandidates.length > 0) {
    return preferredCandidates;
  }
  const fallbackEndpoint = preferredEndpoint === "start" ? "end" : "start";
  return collectForEndpoint(fallbackEndpoint);
}

export function endpointToExtendForArc(
  arc: ArcGeometry,
  clickPoint: TrimExtendPoint,
): "start" | "end" {
  const start = arcEndpoint(arc, "start");
  const end = arcEndpoint(arc, "end");
  const startDistance = pointDistance(clickPoint, start);
  const endDistance = pointDistance(clickPoint, end);
  return startDistance <= endDistance ? "start" : "end";
}

export function collectArcExtendCandidates(
  arc: ArcGeometry,
  boundary: BoundaryGeometry,
  clickPoint: TrimExtendPoint,
  eps: number,
): ExtendArcCandidate[] {
  const supportCircle: BoundaryGeometry = {
    kind: "arc",
    arc: {
      ...arc,
      isCircle: true,
      startAngle: 0,
      endAngle: TWO_PI,
    },
  };
  const intersections = collectArcBoundaryIntersections(supportCircle.arc, boundary, eps);
  if (intersections.length === 0) {
    return [];
  }

  const preferredEndpoint = endpointToExtendForArc(arc, clickPoint);
  const collectForEndpoint = (fromEndpoint: "start" | "end"): ExtendArcCandidate[] => {
    const candidates: ExtendArcCandidate[] = [];
    intersections.forEach((point) => {
      const rawAngle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
      const normalized = normalizeAngle(rawAngle);

      if (fromEndpoint === "end") {
        let nextEnd = normalized;
        while (nextEnd <= arc.endAngle + eps) {
          nextEnd += TWO_PI;
        }
        const delta = nextEnd - arc.endAngle;
        if (delta <= eps) {
          return;
        }
        candidates.push({
          intersection: point,
          fromEndpoint,
          nextStartAngle: arc.startAngle,
          nextEndAngle: nextEnd,
          extensionAngleDelta: delta,
        });
        return;
      }

      let nextStart = normalized;
      while (nextStart >= arc.startAngle - eps) {
        nextStart -= TWO_PI;
      }
      const delta = arc.startAngle - nextStart;
      if (delta <= eps) {
        return;
      }
      candidates.push({
        intersection: point,
        fromEndpoint,
        nextStartAngle: nextStart,
        nextEndAngle: arc.endAngle,
        extensionAngleDelta: delta,
      });
    });

    return candidates.sort((left, right) => left.extensionAngleDelta - right.extensionAngleDelta);
  };

  const preferredCandidates = collectForEndpoint(preferredEndpoint);
  if (preferredCandidates.length > 0) {
    return preferredCandidates;
  }
  const fallbackEndpoint = preferredEndpoint === "start" ? "end" : "start";
  return collectForEndpoint(fallbackEndpoint);
}

export function collectExtendIntersections(
  target: TargetGeometry,
  boundary: BoundaryGeometry,
  clickPoint: TrimExtendPoint,
  eps: number,
): TrimExtendPoint[] {
  if (target.kind === "line") {
    return collectLineExtendCandidates(target.line, boundary, clickPoint, eps).map(
      (candidate) => candidate.intersection,
    );
  }
  return collectArcExtendCandidates(target.arc, boundary, clickPoint, eps).map(
    (candidate) => candidate.intersection,
  );
}
