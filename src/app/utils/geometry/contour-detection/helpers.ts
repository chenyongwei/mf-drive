import type { Entity, Point } from "../../../types/editing";
import { pointKey as pointKeyShared, pointsEqual as pointsEqualShared } from "../../../../shared/utils/geometry/distance";
import { getEntityEndpoints as getEntityEndpointsShared } from "../../../../shared/utils/geometry/contour/endpoints";
import { POINT_TOLERANCE } from "./types";

export function pointKey(point: Point): string {
  return pointKeyShared(point, 4);
}

export function pointsEqual(
  p1: Point,
  p2: Point,
  tolerance: number = POINT_TOLERANCE,
): boolean {
  return pointsEqualShared(p1, p2, tolerance);
}

export function getEntityEndpoints(
  entity: Entity,
): { start: Point | null; end: Point | null } {
  return getEntityEndpointsShared(entity as any) as { start: Point | null; end: Point | null };
}
