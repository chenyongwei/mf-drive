import { Point, BoundingBox } from '../types/NestingTypes';

/**
 * Rotates a set of points around (0,0) by a given angle in degrees.
 */
export function rotatePoints(points: Point[], angleDeg: number): Point[] {
    const rad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return points.map(p => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
    }));
}

/**
 * Calculates the bounding box for a set of points.
 */
export function calculateBoundingBox(points: Point[]): BoundingBox {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = points[0].x, minY = points[0].y, maxX = points[0].x, maxY = points[0].y;
    for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x);
        minY = Math.min(minY, points[i].y);
        maxX = Math.max(maxX, points[i].x);
        maxY = Math.max(maxY, points[i].y);
    }
    return { minX, minY, maxX, maxY };
}

/**
 * Helper to get the bounding box of a contour at a specific rotation.
 * Assumes contour points are local (centered at pivot).
 */
export function getRotatedBoundingBox(contour: Point[], angleDeg: number): BoundingBox {
    if (!contour || contour.length === 0) {
        // Return a zero box or handle error. 
        // For fallback, returning a minimal box is safer than crashing.
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    const rotated = rotatePoints(contour, angleDeg);
    return calculateBoundingBox(rotated);
}
