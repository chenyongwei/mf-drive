import { Point } from '../../../lib/webgpu/CollisionDetectionEngine';
import {
    Edge,
    PartForEdgeDetection,
    TargetContourMode,
} from './ParallelEdgeDetection.types';
export const EDGE_EPSILON = 1e-3;
const CIRCLE_EDGE_SEGMENTS = 48;
function pointsClose(a: Point, b: Point, eps = EDGE_EPSILON): boolean {
    return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}
function normalizePolylinePoints(rawPoints: unknown[]): Point[] {
    const points = rawPoints
        .map((point) => ({
            x: Number((point as any)?.x),
            y: Number((point as any)?.y),
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (points.length >= 2 && pointsClose(points[0], points[points.length - 1])) {
        points.pop();
    }
    return points;
}
function approximateCirclePoints(center: Point, radius: number, segments = CIRCLE_EDGE_SEGMENTS): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
        });
    }
    return points;
}
function approximateArcPoints(
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
): Point[] {
    let normalizedStart = startAngle;
    let normalizedEnd = endAngle;
    if (normalizedEnd <= normalizedStart) {
        normalizedEnd += Math.PI * 2;
    }
    const span = Math.max(1e-4, normalizedEnd - normalizedStart);
    const segments = Math.max(12, Math.min(120, Math.ceil((span / (Math.PI * 2)) * CIRCLE_EDGE_SEGMENTS)));
    const points: Point[] = [];
    for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const angle = normalizedStart + span * t;
        points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
        });
    }
    return points;
}
function getRotationRadians(rotation: number): number {
    if (!Number.isFinite(rotation)) return 0;
    return Math.abs(rotation) > Math.PI * 2 + 1e-6 ? (rotation * Math.PI) / 180 : rotation;
}
function transformLocalPointToWorld(part: PartForEdgeDetection, point: Point): Point {
    const centerX = (part.boundingBox.minX + part.boundingBox.maxX) / 2;
    const centerY = (part.boundingBox.minY + part.boundingBox.maxY) / 2;
    const rotationRad = getRotationRadians(part.rotation);
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const translatedX = point.x - centerX;
    const translatedY = point.y - centerY;
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;
    const mirroredX = part.mirroredX ? -rotatedX : rotatedX;
    const mirroredY = part.mirroredY ? -rotatedY : rotatedY;
    return {
        x: mirroredX + centerX + part.position.x,
        y: mirroredY + centerY + part.position.y,
    };
}
function getPartWorldCenter(part: PartForEdgeDetection): Point {
    const localCenter = {
        x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
        y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
    };
    return transformLocalPointToWorld(part, localCenter);
}
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        const intersects =
            (yi > point.y) !== (yj > point.y) &&
            point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}
function getClosedContours(part: PartForEdgeDetection, isInnerContour: boolean): Point[][] {
    if (!Array.isArray(part.entities) || part.entities.length === 0) {
        return [];
    }
    const contours: Point[][] = [];
    for (const entity of part.entities) {
        const type = String(entity?.type ?? '').toUpperCase();
        const geometry = (entity as any)?.geometry ?? {};
        const entityIsInner = Boolean((entity as any)?.isInnerContour);
        if (entityIsInner !== isInnerContour) {
            continue;
        }
        if (type === 'LWPOLYLINE' || type === 'POLYLINE' || type === 'SPLINE') {
            const rawPoints = Array.isArray(geometry?.points) ? geometry.points : [];
            const originalPoints = rawPoints
                .map((point) => ({
                    x: Number((point as any)?.x),
                    y: Number((point as any)?.y),
                }))
                .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
            const closedByRepeat =
                originalPoints.length >= 3 &&
                pointsClose(originalPoints[0], originalPoints[originalPoints.length - 1]);
            const normalized = normalizePolylinePoints(rawPoints);
            const closed = Boolean(geometry?.closed) || closedByRepeat;
            if (!closed || normalized.length < 3) {
                continue;
            }
            contours.push(normalized.map((point) => transformLocalPointToWorld(part, point)));
            continue;
        }
        if (type === 'CIRCLE') {
            const center = {
                x: Number(geometry?.center?.x),
                y: Number(geometry?.center?.y),
            };
            const radius = Number(geometry?.radius);
            if (!Number.isFinite(center.x) || !Number.isFinite(center.y) || !Number.isFinite(radius) || radius <= 0) {
                continue;
            }
            const points = approximateCirclePoints(center, radius);
            contours.push(points.map((point) => transformLocalPointToWorld(part, point)));
        }
    }
    return contours;
}
export function resolveTargetContourMode(
    draggedPart: PartForEdgeDetection,
    targetPart: PartForEdgeDetection,
): TargetContourMode {
    const innerContours = getClosedContours(targetPart, true);
    if (innerContours.length === 0) {
        return 'outer';
    }
    const draggedCenter = getPartWorldCenter(draggedPart);
    const insideInnerContour = innerContours.some((contour) => isPointInPolygon(draggedCenter, contour));
    return insideInnerContour ? 'inner' : 'outer';
}
function buildEdgesFromPoints(
    part: PartForEdgeDetection,
    points: Point[],
    closed: boolean,
    isInnerContour: boolean,
): Edge[] {
    if (points.length < 2) return [];
    const transformedPoints = points.map((point) => transformLocalPointToWorld(part, point));
    const edges: Edge[] = [];
    for (let i = 0; i < transformedPoints.length - 1; i += 1) {
        const start = transformedPoints[i];
        const end = transformedPoints[i + 1];
        if (pointsClose(start, end)) continue;
        edges.push({
            start,
            end,
            partId: part.id,
            isInnerContour,
        });
    }
    if (closed && transformedPoints.length > 2) {
        const start = transformedPoints[transformedPoints.length - 1];
        const end = transformedPoints[0];
        if (!pointsClose(start, end)) {
            edges.push({
                start,
                end,
                partId: part.id,
                isInnerContour,
            });
        }
    }
    return edges;
}
function getGeometryEdges(part: PartForEdgeDetection): Edge[] {
    if (!Array.isArray(part.entities) || part.entities.length === 0) {
        return [];
    }
    const edges: Edge[] = [];
    for (const entity of part.entities) {
        const type = String(entity?.type ?? '').toUpperCase();
        const geometry = (entity as any)?.geometry ?? {};
        const isInnerContour = Boolean((entity as any)?.isInnerContour);
        if (type === 'LINE') {
            const start = {
                x: Number(geometry?.start?.x),
                y: Number(geometry?.start?.y),
            };
            const end = {
                x: Number(geometry?.end?.x),
                y: Number(geometry?.end?.y),
            };
            if (Number.isFinite(start.x) && Number.isFinite(start.y) && Number.isFinite(end.x) && Number.isFinite(end.y)) {
                edges.push(...buildEdgesFromPoints(part, [start, end], false, isInnerContour));
            }
            continue;
        }
        if (type === 'LWPOLYLINE' || type === 'POLYLINE' || type === 'SPLINE') {
            const points = normalizePolylinePoints(Array.isArray(geometry?.points) ? geometry.points : []);
            if (points.length < 2) continue;
            const closed = Boolean(geometry?.closed);
            edges.push(...buildEdgesFromPoints(part, points, closed, isInnerContour));
            continue;
        }
        if (type === 'CIRCLE') {
            const center = {
                x: Number(geometry?.center?.x),
                y: Number(geometry?.center?.y),
            };
            const radius = Number(geometry?.radius);
            if (!Number.isFinite(center.x) || !Number.isFinite(center.y) || !Number.isFinite(radius) || radius <= 0) {
                continue;
            }
            const points = approximateCirclePoints(center, radius);
            edges.push(...buildEdgesFromPoints(part, points, true, isInnerContour));
            continue;
        }
        if (type === 'ARC') {
            const center = {
                x: Number(geometry?.center?.x),
                y: Number(geometry?.center?.y),
            };
            const radius = Number(geometry?.radius);
            const startAngle = Number(geometry?.startAngle ?? 0);
            const endAngle = Number(geometry?.endAngle ?? 0);
            if (
                !Number.isFinite(center.x) ||
                !Number.isFinite(center.y) ||
                !Number.isFinite(radius) ||
                radius <= 0 ||
                !Number.isFinite(startAngle) ||
                !Number.isFinite(endAngle)
            ) {
                continue;
            }
            const points = approximateArcPoints(center, radius, startAngle, endAngle);
            edges.push(...buildEdgesFromPoints(part, points, false, isInnerContour));
            continue;
        }
    }
    return edges;
}
function getBoundingBoxEdges(part: PartForEdgeDetection): Edge[] {
    const { minX, minY, maxX, maxY } = part.boundingBox;
    const { x, y } = part.position;
    const corners = [
        { x: minX + x, y: minY + y },
        { x: maxX + x, y: minY + y },
        { x: maxX + x, y: maxY + y },
        { x: minX + x, y: maxY + y },
    ];
    return [
        { start: corners[0], end: corners[1], partId: part.id, isInnerContour: false },
        { start: corners[1], end: corners[2], partId: part.id, isInnerContour: false },
        { start: corners[2], end: corners[3], partId: part.id, isInnerContour: false },
        { start: corners[3], end: corners[0], partId: part.id, isInnerContour: false },
    ];
}
export function getPartEdges(part: PartForEdgeDetection): Edge[] {
    const geometryEdges = getGeometryEdges(part);
    if (geometryEdges.length > 0) {
        return geometryEdges;
    }
    return getBoundingBoxEdges(part);
}
