/**
 * Shared Geometry Utilities
 *
 * A comprehensive library for geometric calculations and operations.
 * All functions are isomorphic (work in both Node.js and browser).
 *
 * @module utils/geometry
 *
 * @example
 * ```ts
 * // Import specific functions
 * import { distance, angleBetweenPoints } from '@dxf-fix/shared/utils/geometry';
 *
 * // Import entire modules
 * import * as DistanceUtils from '@dxf-fix/shared/utils/geometry';
 * ```
 */

// ============================================================================
// Distance and Point Calculations
// ============================================================================

export {
  distance,
  distanceSquared,
  pointToLineSegmentDistance,
  closestPointOnLine,
  midpoint,
  pointsEqual,
  pointKey,
} from "./distance";

// ============================================================================
// Intersection Calculations
// ============================================================================

export {
  doLinesIntersect,
  getLineIntersection,
  getLineCircleIntersection,
  getCircleCircleIntersection,
  extendLineToBoundary,
} from "./intersection";

export type { LineSegment, Circle } from "./intersection";

// ============================================================================
// Angle Calculations
// ============================================================================

export {
  angleBetweenPoints,
  angleBetweenLineSegments,
  lineDirection,
  radToDeg,
  degToRad,
  normalizeAngle,
  normalizeAngleSigned,
  angleDifference,
  rotatePoint,
  arePointsCollinear,
} from "./angle";

// ============================================================================
// Polygon Operations
// ============================================================================

export {
  polygonArea,
  polygonAreaSigned,
  polygonPerimeter,
  isPointInPolygon,
  isPointOnPolygonBoundary,
  isConvexPolygon,
  polygonOrientation,
  polygonCentroid,
} from "./polygon";

// ============================================================================
// Bounding Box Operations
// ============================================================================

export {
  createBBox,
  bboxFromPoint,
  bboxFromPoints,
  bboxFromLine,
  bboxFromCircle,
  bboxFromArc,
  bboxWidth,
  bboxHeight,
  bboxArea,
  bboxCenter,
  bboxIntersect,
  bboxContainsPoint,
  bboxContainsBBox,
  mergeBBox,
  intersectBBox,
  expandBBox,
} from "./bbox";

// ============================================================================
// Contour Detection
// ============================================================================

export {
  buildGraph,
  findClosedLoops,
  validateContour,
  extractVerticesFromLoop,
  filterNestedContours,
  detectContours,
  getEntityEndpoints,
} from "./contour";

export type {
  Entity,
  EntityGraph,
  GraphNode,
  ContourDetectionResult,
} from "./contour";

// ============================================================================
// Transformations
// ============================================================================

export {
  translatePoint,
  translatePoints,
  scalePoint,
  scalePoints,
  rotatePoint as rotatePointTransform,
  rotatePoints as rotatePointsTransform,
  reflectPointAcrossLine,
  reflectPointAcrossX,
  reflectPointAcrossY,
  reflectPointAcrossOrigin,
  reflectPointsAcrossLine,
  reflectPointsAcrossX,
  reflectPointsAcrossY,
  reflectPointsAcrossOrigin,
  shearPoint,
  shearPoints,
  transformPoint,
  transformPoints,
  alignPointsToAngle,
  createTransformMatrix,
} from "./transform";

export type {
  Translation,
  Scale,
  Rotation,
  Shear,
  Transformation,
} from "./transform";

// ============================================================================
// Validation
// ============================================================================

export {
  validatePoint,
  validatePoints,
  validateBBox,
  validatePolygon,
  validateLineSegment,
  validateCircle,
  validatePointInBBox,
  validatePolygonClosed,
  validateGeometry,
  isValidWinding,
  isValidGeometry,
} from "./validation";

export type { ValidationResult } from "./validation";

// ============================================================================
// Convenience Re-exports (from other modules)
// ============================================================================

// Re-export Point type for convenience
export type { Point } from "../../types";

// Re-export rotatePoint with a clearer name to avoid conflicts
export { rotatePoint as rotatePointAround } from "./angle";

/**
 * @example
 * Calculate distance between two points
 * ```ts
 * import { distance } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 0, y: 0 };
 * const p2 = { x: 3, y: 4 };
 * const dist = distance(p1, p2); // 5
 * ```
 */

/**
 * @example
 * Calculate angle between three points
 * ```ts
 * import { angleBetweenPoints, radToDeg } from '@dxf-fix/shared/utils/geometry';
 *
 * const p1 = { x: 1, y: 0 };
 * const vertex = { x: 0, y: 0 };
 * const p3 = { x: 0, y: 1 };
 * const angle = angleBetweenPoints(p1, vertex, p3);
 * const degrees = radToDeg(angle); // 90
 * ```
 */

/**
 * @example
 * Check if point is inside polygon
 * ```ts
 * import { isPointInPolygon } from '@dxf-fix/shared/utils/geometry';
 *
 * const square = [
 *   { x: 0, y: 0 },
 *   { x: 10, y: 0 },
 *   { x: 10, y: 10 },
 *   { x: 0, y: 10 }
 * ];
 * isPointInPolygon({ x: 5, y: 5 }, square); // true
 * ```
 */

/**
 * @example
 * Detect closed contours from entities
 * ```ts
 * import { detectContours } from '@dxf-fix/shared/utils/geometry';
 *
 * const entities = [
 *   { id: '1', type: 'LINE', geometry: { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } } },
 *   { id: '2', type: 'LINE', geometry: { start: { x: 10, y: 0 }, end: { x: 10, y: 10 } } },
 *   { id: '3', type: 'LINE', geometry: { start: { x: 10, y: 10 }, end: { x: 0, y: 10 } } },
 *   { id: '4', type: 'LINE', geometry: { start: { x: 0, y: 10 }, end: { x: 0, y: 0 } } }
 * ];
 * const result = detectContours(entities);
 * // result.contours.length === 1
 * ```
 */

/**
 * @example
 * Transform points
 * ```ts
 * import { translatePoints, scalePoints, rotatePoints } from '@dxf-fix/shared/utils/geometry';
 *
 * const points = [{ x: 10, y: 10 }];
 *
 * // Translate
 * const translated = translatePoints(points, { dx: 5, dy: 5 });
 *
 * // Scale
 * const scaled = scalePoints(points, { sx: 2, sy: 2 });
 *
 * // Rotate 45 degrees around origin
 * const rotated = rotatePoints(points, { angle: Math.PI / 4 });
 * ```
 */

/**
 * @example
 * Validate geometry
 * ```ts
 * import { validatePolygon, validateCircle } from '@dxf-fix/shared/utils/geometry';
 *
 * const square = [
 *   { x: 0, y: 0 },
 *   { x: 10, y: 0 },
 *   { x: 10, y: 10 },
 *   { x: 0, y: 10 }
 * ];
 * const result = validatePolygon(square);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
