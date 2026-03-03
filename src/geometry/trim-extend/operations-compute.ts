import { type ExtendRequest, TRIM_EXTEND_EPS, type TrimExtendPlan, type TrimRequest, type BoundaryInferenceResult } from "./types";
import { parseBoundaryGeometry, clonePoint } from "./geometry";
import { resolveBoundary, pickNearestPoint } from "./boundary";
import { collectIntersections } from "./intersections-collect";
import {
  buildErrorPlan,
  buildSuccessPlan,
  extendArc,
  extendLine,
  mustResolveTarget,
  trimArc,
  trimLine,
} from "./operations-shared";

export function computeTrimPlan(request: TrimRequest): TrimExtendPlan {
  const eps = request.eps ?? TRIM_EXTEND_EPS;
  const targetResolution = mustResolveTarget(
    request.entities,
    request.targetEntityId,
    "trim",
    eps,
  );
  if (targetResolution.error) {
    return targetResolution.error;
  }
  const targetEntity = targetResolution.targetEntity!;
  const targetGeometry = targetResolution.targetGeometry!;

  const boundary = resolveBoundary(request, targetEntity, targetGeometry, "trim", eps);
  if ("errorCode" in boundary) {
    return buildErrorPlan("trim", targetEntity.id, boundary.errorCode, boundary.message);
  }

  const boundaryEntity = request.entities.find((entity) => entity.id === boundary.boundaryEntityId);
  if (!boundaryEntity) {
    return buildErrorPlan("trim", targetEntity.id, "BOUNDARY_REQUIRED", "boundary entity not found");
  }

  const intersections = collectIntersections(targetEntity, boundaryEntity, { eps });
  if (intersections.length === 0) {
    return buildErrorPlan("trim", targetEntity.id, "NO_INTERSECTION", "no intersection between target and boundary");
  }

  const updatedEntity =
    targetGeometry.kind === "line"
      ? trimLine(targetEntity, targetGeometry.line, request.clickPoint, intersections, eps)
      : trimArc(targetEntity, targetGeometry.arc, request.clickPoint, intersections, eps);
  if (!updatedEntity) {
    return buildErrorPlan("trim", targetEntity.id, "NO_INTERSECTION", "trim failed");
  }

  const intersectionPoint = pickNearestPoint(intersections, request.clickPoint);
  const normalizedBoundary: BoundaryInferenceResult = {
    ...boundary,
    intersectionPoint: intersectionPoint
      ? clonePoint(intersectionPoint)
      : clonePoint(boundary.intersectionPoint),
  };
  return buildSuccessPlan("trim", targetEntity.id, updatedEntity, normalizedBoundary);
}

export function computeExtendPlan(request: ExtendRequest): TrimExtendPlan {
  const eps = request.eps ?? TRIM_EXTEND_EPS;
  const targetResolution = mustResolveTarget(
    request.entities,
    request.targetEntityId,
    "extend",
    eps,
  );
  if (targetResolution.error) {
    return targetResolution.error;
  }
  const targetEntity = targetResolution.targetEntity!;
  const targetGeometry = targetResolution.targetGeometry!;

  const boundary = resolveBoundary(request, targetEntity, targetGeometry, "extend", eps);
  if ("errorCode" in boundary) {
    return buildErrorPlan("extend", targetEntity.id, boundary.errorCode, boundary.message);
  }

  const boundaryEntity = request.entities.find((entity) => entity.id === boundary.boundaryEntityId);
  if (!boundaryEntity) {
    return buildErrorPlan("extend", targetEntity.id, "BOUNDARY_REQUIRED", "boundary entity not found");
  }

  const parsedBoundary = parseBoundaryGeometry(boundaryEntity, eps);
  if (!parsedBoundary) {
    return buildErrorPlan("extend", targetEntity.id, "UNSUPPORTED_BOUNDARY", "unsupported boundary entity");
  }

  const extensionResult =
    targetGeometry.kind === "line"
      ? extendLine(targetEntity, targetGeometry.line, parsedBoundary, request.clickPoint, eps)
      : extendArc(targetEntity, targetGeometry.arc, parsedBoundary, request.clickPoint, eps);
  if (!extensionResult) {
    return buildErrorPlan("extend", targetEntity.id, "NO_INTERSECTION", "no intersection for extension");
  }

  const normalizedBoundary: BoundaryInferenceResult = {
    ...boundary,
    intersectionPoint: clonePoint(extensionResult.intersectionPoint),
  };

  return buildSuccessPlan(
    "extend",
    targetEntity.id,
    extensionResult.updatedEntity,
    normalizedBoundary,
  );
}
