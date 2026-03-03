import {
  TRIM_EXTEND_EPS,
  type ArcGeometry,
  type BoundaryCandidate,
  type BoundaryInferenceResult,
  type ExtendRequest,
  type TargetGeometry,
  type TrimExtendCommand,
  type TrimExtendEntityLike,
  type TrimExtendErrorCode,
  type TrimExtendPoint,
  type TrimRequest,
} from "./types";
import { clonePoint, isSameFile, parseBoundaryGeometry, parseTargetGeometry, pointDistance } from "./geometry";
import { collectIntersections } from "./intersections-collect";
import {
  collectArcExtendCandidates,
  collectLineExtendCandidates,
  endpointToExtendForArc,
  endpointToExtendForLine,
} from "./extensions";
import { dedupePoints } from "./intersections-core";

export function pickNearestPoint(
  points: TrimExtendPoint[],
  clickPoint: TrimExtendPoint,
): TrimExtendPoint | null {
  if (points.length === 0) {
    return null;
  }
  let winner = points[0];
  let bestDistance = pointDistance(winner, clickPoint);
  for (let index = 1; index < points.length; index += 1) {
    const candidate = points[index];
    const distance = pointDistance(candidate, clickPoint);
    if (distance < bestDistance) {
      winner = candidate;
      bestDistance = distance;
    }
  }
  return winner;
}

function inferBoundaryCandidate(
  entities: TrimExtendEntityLike[],
  target: TrimExtendEntityLike,
  targetGeometry: TargetGeometry,
  clickPoint: TrimExtendPoint,
  command: TrimExtendCommand,
  eps: number,
): BoundaryCandidate | null {
  const candidates: BoundaryCandidate[] = [];

  entities.forEach((entity) => {
    if (entity.id === target.id || !isSameFile(entity, target)) {
      return;
    }
    const boundary = parseBoundaryGeometry(entity, eps);
    if (!boundary) {
      return;
    }

    if (command === "trim") {
      const intersections = collectIntersections(target, entity, { eps });
      if (intersections.length === 0) {
        return;
      }
      const nearest = pickNearestPoint(intersections, clickPoint);
      if (!nearest) {
        return;
      }
      candidates.push({
        entity,
        intersections,
        intersectionPoint: nearest,
        score: pointDistance(nearest, clickPoint),
      });
      return;
    }

    if (targetGeometry.kind === "line") {
      const extendCandidates = collectLineExtendCandidates(
        targetGeometry.line,
        boundary,
        clickPoint,
        eps,
      );
      if (extendCandidates.length === 0) {
        return;
      }
      const preferredEndpoint = endpointToExtendForLine(targetGeometry.line, clickPoint);
      const preferredSideCandidates = extendCandidates.filter(
        (candidate) => candidate.fromEndpoint === preferredEndpoint,
      );
      const candidatePool =
        preferredSideCandidates.length > 0 ? preferredSideCandidates : extendCandidates;
      const best = candidatePool[0];
      const fallbackPenalty = preferredSideCandidates.length > 0 ? 0 : 1_000_000;
      candidates.push({
        entity,
        intersections: dedupePoints(
          extendCandidates.map((candidate) => candidate.intersection),
          eps,
        ),
        intersectionPoint: clonePoint(best.intersection),
        score: best.extensionLength + fallbackPenalty,
      });
      return;
    }

    const extendCandidates = collectArcExtendCandidates(
      targetGeometry.arc,
      boundary,
      clickPoint,
      eps,
    );
    if (extendCandidates.length === 0) {
      return;
    }
    const preferredEndpoint = endpointToExtendForArc(targetGeometry.arc, clickPoint);
    const preferredSideCandidates = extendCandidates.filter(
      (candidate) => candidate.fromEndpoint === preferredEndpoint,
    );
    const candidatePool =
      preferredSideCandidates.length > 0 ? preferredSideCandidates : extendCandidates;
    const best = candidatePool[0];
    const fallbackPenalty = preferredSideCandidates.length > 0 ? 0 : 1_000_000;
    candidates.push({
      entity,
      intersections: dedupePoints(
        extendCandidates.map((candidate) => candidate.intersection),
        eps,
      ),
      intersectionPoint: clonePoint(best.intersection),
      score: best.extensionAngleDelta * targetGeometry.arc.radius + fallbackPenalty,
    });
  });

  if (candidates.length === 0) {
    return null;
  }
  candidates.sort((left, right) => {
    if (Math.abs(left.score - right.score) > eps) {
      return left.score - right.score;
    }
    return (
      pointDistance(left.intersectionPoint, clickPoint) -
      pointDistance(right.intersectionPoint, clickPoint)
    );
  });
  return candidates[0];
}

export function resolveBoundary(
  request: TrimRequest | ExtendRequest,
  target: TrimExtendEntityLike,
  targetGeometry: TargetGeometry,
  command: TrimExtendCommand,
  eps: number,
): BoundaryInferenceResult | { errorCode: TrimExtendErrorCode; message: string } {
  if (request.boundaryEntityId) {
    const boundary = request.entities.find((entity) => entity.id === request.boundaryEntityId);
    if (!boundary) {
      return { errorCode: "BOUNDARY_REQUIRED", message: "boundary entity not found" };
    }
    if (!isSameFile(boundary, target)) {
      return {
        errorCode: "UNSUPPORTED_BOUNDARY",
        message: "boundary must be in the same file as target",
      };
    }

    const parsedBoundary = parseBoundaryGeometry(boundary, eps);
    if (!parsedBoundary) {
      return { errorCode: "UNSUPPORTED_BOUNDARY", message: "unsupported boundary entity" };
    }

    let intersections: TrimExtendPoint[] = [];
    let intersectionPoint: TrimExtendPoint | null = null;

    if (command === "trim") {
      intersections = collectIntersections(target, boundary, { eps });
      intersectionPoint = pickNearestPoint(intersections, request.clickPoint);
    } else if (targetGeometry.kind === "line") {
      const extendCandidates = collectLineExtendCandidates(
        targetGeometry.line,
        parsedBoundary,
        request.clickPoint,
        eps,
      );
      intersections = dedupePoints(
        extendCandidates.map((candidate) => candidate.intersection),
        eps,
      );
      intersectionPoint = extendCandidates[0]?.intersection ?? null;
    } else {
      const extendCandidates = collectArcExtendCandidates(
        targetGeometry.arc,
        parsedBoundary,
        request.clickPoint,
        eps,
      );
      intersections = dedupePoints(
        extendCandidates.map((candidate) => candidate.intersection),
        eps,
      );
      intersectionPoint = extendCandidates[0]?.intersection ?? null;
    }

    if (intersections.length === 0 || !intersectionPoint) {
      return {
        errorCode: "NO_INTERSECTION",
        message: "no intersection between target and boundary",
      };
    }

    return {
      boundaryEntityId: boundary.id,
      source: "manual",
      intersections,
      intersectionPoint: clonePoint(intersectionPoint),
    };
  }

  const inferred = inferBoundaryCandidate(
    request.entities,
    target,
    targetGeometry,
    request.clickPoint,
    command,
    eps,
  );
  if (!inferred) {
    return { errorCode: "BOUNDARY_REQUIRED", message: "boundary is required" };
  }

  return {
    boundaryEntityId: inferred.entity.id,
    source: "auto",
    intersections: inferred.intersections,
    intersectionPoint: clonePoint(inferred.intersectionPoint),
  };
}

export function inferBestBoundary(
  request: TrimRequest | ExtendRequest,
  command: TrimExtendCommand,
): BoundaryInferenceResult | { errorCode: TrimExtendErrorCode; message: string } {
  const eps = request.eps ?? TRIM_EXTEND_EPS;
  const target = request.entities.find((entity) => entity.id === request.targetEntityId);
  if (!target) {
    return { errorCode: "TARGET_NOT_FOUND", message: "target entity not found" };
  }
  const targetGeometry = parseTargetGeometry(target, eps);
  if (!targetGeometry) {
    return {
      errorCode: "UNSUPPORTED_TARGET",
      message: "target entity must be LINE or ARC",
    };
  }
  return resolveBoundary(request, target, targetGeometry, command, eps);
}
