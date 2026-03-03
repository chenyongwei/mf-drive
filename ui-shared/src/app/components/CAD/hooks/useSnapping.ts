import { useRef, useCallback, useMemo } from 'react';
import { Entity } from '../../../lib/webgpu/EntityToVertices';

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'none';

export interface SnapPoint {
    x: number;
    y: number;
    type: SnapType;
    distance?: number;
}

interface UseSnappingProps {
    entities: Entity[];
    viewport: {
        zoom: number;
        pan: { x: number; y: number };
    };
    snapDistance?: number; // Screen pixels
}

export const useSnapping = ({
    entities,
    viewport,
    snapDistance = 30,  // Pixels - comfortable snap detection distance
}: UseSnappingProps) => {
    const snapPointRef = useRef<SnapPoint | null>(null);

    // Calculate snap points from entities
    const availableSnapPoints = useMemo(() => {
        const points: SnapPoint[] = [];
        if (!entities || !Array.isArray(entities)) return points;

        entities.forEach(entity => {
            if (entity.type === 'LINE' && entity.geometry?.start && entity.geometry?.end) {
                // Endpoints
                points.push({ x: entity.geometry.start.x, y: entity.geometry.start.y, type: 'endpoint' });
                points.push({ x: entity.geometry.end.x, y: entity.geometry.end.y, type: 'endpoint' });
                // Midpoint
                points.push({
                    x: (entity.geometry.start.x + entity.geometry.end.x) / 2,
                    y: (entity.geometry.start.y + entity.geometry.end.y) / 2,
                    type: 'midpoint'
                });
            } else if ((entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') && Array.isArray(entity.geometry?.points)) {
                // Polyline vertices
                entity.geometry.points.forEach((point: { x: number; y: number }) => {
                    points.push({
                        x: point.x,
                        y: point.y,
                        type: 'endpoint'
                    });
                });
                // TODO: Add polyline midpoints logic
            } else if (entity.type === 'CIRCLE' && entity.geometry?.center) {
                // Center
                points.push({
                    x: entity.geometry.center.x,
                    y: entity.geometry.center.y,
                    type: 'center'
                });
                // Quadrants could be added here
            } else if (entity.type === 'ARC' && entity.geometry?.center && entity.geometry?.radius !== undefined) {
                // Center
                points.push({
                    x: entity.geometry.center.x,
                    y: entity.geometry.center.y,
                    type: 'center'
                });
                // Endpoints
                const startAngle = entity.geometry.startAngle ?? 0;
                const endAngle = entity.geometry.endAngle ?? 2 * Math.PI;
                points.push({
                    x: entity.geometry.center.x + entity.geometry.radius * Math.cos(startAngle),
                    y: entity.geometry.center.y + entity.geometry.radius * Math.sin(startAngle),
                    type: 'endpoint'
                });
                points.push({
                    x: entity.geometry.center.x + entity.geometry.radius * Math.cos(endAngle),
                    y: entity.geometry.center.y + entity.geometry.radius * Math.sin(endAngle),
                    type: 'endpoint'
                });
            } else if (entity.type === 'ELLIPSE' && entity.geometry?.center) {
                // Center
                points.push({
                    x: entity.geometry.center.x,
                    y: entity.geometry.center.y,
                    type: 'center'
                });
                // TODO: Ellipse endpoints/quadrants logic is more complex
            }
        });

        return points;
    }, [entities]);

    // Spatial index for snap points
    const snapGrid = useMemo(() => {
        const grid = new Map<string, SnapPoint[]>();
        const cellSize = 50; // Grid cell size in world units

        availableSnapPoints.forEach(point => {
            const gx = Math.floor(point.x / cellSize);
            const gy = Math.floor(point.y / cellSize);
            const key = `${gx},${gy}`;
            const cell = grid.get(key) || [];
            cell.push(point);
            grid.set(key, cell);
        });

        return { grid, cellSize };
    }, [availableSnapPoints]);

    // Find nearest snap point and update snapPoint state for indicator display
    const findNearestSnapPoint = useCallback((
        cursorX: number, // World coordinates
        cursorY: number  // World coordinates
    ): SnapPoint | null => {
        if (!entities || entities.length === 0) {
            snapPointRef.current = null;
            return null;
        }

        // Convert validation distance from screen pixels to world units
        const threshold = snapDistance / viewport.zoom;
        const thresholdSq = threshold * threshold;

        let nearest: SnapPoint | null = null;
        let minDistSq = thresholdSq;

        // Query only relevant grid cells
        const { grid, cellSize } = snapGrid;
        const minGX = Math.floor((cursorX - threshold) / cellSize);
        const maxGX = Math.floor((cursorX + threshold) / cellSize);
        const minGY = Math.floor((cursorY - threshold) / cellSize);
        const maxGY = Math.floor((cursorY + threshold) / cellSize);

        for (let gx = minGX; gx <= maxGX; gx++) {
            for (let gy = minGY; gy <= maxGY; gy++) {
                const points = grid.get(`${gx},${gy}`);
                if (!points) continue;

                for (const point of points) {
                    const dx = point.x - cursorX;
                    const dy = point.y - cursorY;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < minDistSq) {
                        minDistSq = distSq;
                        nearest = { ...point, distance: Math.sqrt(distSq) };
                    }
                }
            }
        }

        // Keep latest snap point in ref to avoid render-queue churn during frequent mouse move.
        snapPointRef.current = nearest;
        return nearest;
    }, [snapGrid, viewport.zoom, snapDistance, entities]);

    // Clear snap point
    const clearSnapPoint = useCallback(() => {
        snapPointRef.current = null;
    }, []);

    return {
        snapPoint: snapPointRef.current,
        setSnapPoint: (value: SnapPoint | null) => {
            snapPointRef.current = value;
        },
        findNearestSnapPoint,
        clearSnapPoint,
    };
};
