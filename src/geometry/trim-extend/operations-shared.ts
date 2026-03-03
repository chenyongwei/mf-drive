import {
  TRIM_EXTEND_EPS,
  type ArcGeometry,
  type BoundaryGeometry,
  type BoundaryInferenceResult,
  type ExtendRequest,
  type LineGeometry,
  type TargetGeometry,
  type TrimExtendCommand,
  type TrimExtendEntityLike,
  type TrimExtendErrorCode,
  type TrimExtendPlan,
  type TrimExtendPoint,
} from "./types";
import {
  clonePoint,
  normalizeAngleIntoArc,
  parseTargetGeometry,
  pointDistance,
} from "./geometry";
import {
  collectArcExtendCandidates,
  collectLineExtendCandidates,
} from "./extensions";
import { pickNearestPoint } from "./boundary";

export function buildSuccessPlan(
  command: TrimExtendCommand,
  targetId: string,
  updatedEntity: TrimExtendEntityLike,
  boundary: BoundaryInferenceResult,
): TrimExtendPlan {
  return {
    success: true,
    command,
    updatedEntity,
    affectedEntityIds: [targetId],
    boundaryEntityId: boundary.boundaryEntityId,
    boundarySource: boundary.source,
    intersectionPoint: clonePoint(boundary.intersectionPoint),
  };
}

export function buildErrorPlan(
  command: TrimExtendCommand,
  targetId: string,
  errorCode: TrimExtendErrorCode,
  message: string,
): TrimExtendPlan {
  return {
    success: false,
    command,
    affectedEntityIds: targetId ? [targetId] : [],
    errorCode,
    message,
  };
}

export function linePointParam(line: LineGeometry, point: TrimExtendPoint): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= TRIM_EXTEND_EPS) {
    return 0;
  }
  return ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) / lengthSquared;
}

export function trimLine(
  targetEntity: TrimExtendEntityLike,
  line: LineGeometry,
  clickPoint: TrimExtendPoint,
  intersections: TrimExtendPoint[],
  eps: number,
): TrimExtendEntityLike | null {
  if (intersections.length === 0) {
    return null;
  }

  const clickParam = linePointParam(line, clickPoint);
  let point = intersections[0];
  let intersectionParam = linePointParam(line, point);
  let bestScore = Math.abs(intersectionParam - clickParam);

  intersections.slice(1).forEach((candidate) => {
    const candidateParam = linePointParam(line, candidate);
    const candidateScore = Math.abs(candidateParam - clickParam);
    if (candidateScore < bestScore) {
      point = candidate;
      intersectionParam = candidateParam;
      bestScore = candidateScore;
    }
  });

  const trimStart = clickParam <= intersectionParam;
  const nextGeometry = trimStart
    ? { start: clonePoint(point), end: clonePoint(line.end) }
    : { start: clonePoint(line.start), end: clonePoint(point) };

  if (pointDistance(nextGeometry.start, nextGeometry.end) <= eps) {
    return null;
  }

  return {
    ...targetEntity,
    geometry: nextGeometry as unknown as Record<string, unknown>,
  };
}

export function trimArc(
  targetEntity: TrimExtendEntityLike,
  arc: ArcGeometry,
  clickPoint: TrimExtendPoint,
  intersections: TrimExtendPoint[],
  eps: number,
): TrimExtendEntityLike | null {
  const point = pickNearestPoint(intersections, clickPoint);
  if (!point) {
    return null;
  }

  const intersectionAngle = normalizeAngleIntoArc(
    Math.atan2(point.y - arc.center.y, point.x - arc.center.x),
    arc,
  );
  const clickAngle = normalizeAngleIntoArc(
    Math.atan2(clickPoint.y - arc.center.y, clickPoint.x - arc.center.x),
    arc,
  );

  let nextStart = arc.startAngle;
  let nextEnd = arc.endAngle;
  if (clickAngle <= intersectionAngle) {
    nextStart = intersectionAngle;
  } else {
    nextEnd = intersectionAngle;
  }

  if (nextEnd - nextStart <= eps) {
    return null;
  }

  return {
    ...targetEntity,
    geometry: {
      center: clonePoint(arc.center),
      radius: arc.radius,
      startAngle: nextStart,
      endAngle: nextEnd,
    } as unknown as Record<string, unknown>,
  };
}

export function extendLine(
  targetEntity: TrimExtendEntityLike,
  line: LineGeometry,
  boundary: BoundaryGeometry,
  clickPoint: TrimExtendPoint,
  eps: number,
): { updatedEntity: TrimExtendEntityLike; intersectionPoint: TrimExtendPoint } | null {
  const candidates = collectLineExtendCandidates(line, boundary, clickPoint, eps);
  if (candidates.length === 0) {
    return null;
  }
  const best = candidates[0];
  const nextGeometry =
    best.fromEndpoint === "start"
      ? { start: clonePoint(best.intersection), end: clonePoint(line.end) }
      : { start: clonePoint(line.start), end: clonePoint(best.intersection) };

  if (pointDistance(nextGeometry.start, nextGeometry.end) <= eps) {
    return null;
  }

  return {
    updatedEntity: {
      ...targetEntity,
      geometry: nextGeometry as unknown as Record<string, unknown>,
    },
    intersectionPoint: clonePoint(best.intersection),
  };
}

export function extendArc(
  targetEntity: TrimExtendEntityLike,
  arc: ArcGeometry,
  boundary: BoundaryGeometry,
  clickPoint: TrimExtendPoint,
  eps: number,
): { updatedEntity: TrimExtendEntityLike; intersectionPoint: TrimExtendPoint } | null {
  const candidates = collectArcExtendCandidates(arc, boundary, clickPoint, eps);
  if (candidates.length === 0) {
    return null;
  }
  const best = candidates[0];
  if (best.nextEndAngle - best.nextStartAngle <= eps) {
    return null;
  }

  return {
    updatedEntity: {
      ...targetEntity,
      geometry: {
        center: clonePoint(arc.center),
        radius: arc.radius,
        startAngle: best.nextStartAngle,
        endAngle: best.nextEndAngle,
      } as unknown as Record<string, unknown>,
    },
    intersectionPoint: clonePoint(best.intersection),
  };
}

export function mustResolveTarget(
  entities: TrimExtendEntityLike[],
  targetEntityId: string,
  command: TrimExtendCommand,
  eps: number,
): {
  targetEntity?: TrimExtendEntityLike;
  targetGeometry?: TargetGeometry;
  error?: TrimExtendPlan;
} {
  const targetEntity = entities.find((entity) => entity.id === targetEntityId);
  if (!targetEntity) {
    return {
      error: buildErrorPlan(command, targetEntityId, "TARGET_NOT_FOUND", "target entity not found"),
    };
  }

  const targetGeometry = parseTargetGeometry(targetEntity, eps);
  if (!targetGeometry) {
    return {
      error: buildErrorPlan(command, targetEntityId, "UNSUPPORTED_TARGET", "target entity must be LINE or ARC"),
    };
  }

  return { targetEntity, targetGeometry };
}
