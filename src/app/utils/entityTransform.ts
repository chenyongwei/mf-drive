import { Entity } from '../lib/webgpu/EntityToVertices';
import {
    Transformation,
    transformPoint,
    translatePoint,
    rotatePoint,
    scalePoint,
    reflectPointAcrossLine,
    shearPoint,
    Rotation,
    Scale,
    Translation,
    Shear
} from '@dxf-fix/shared/utils/geometry';

/**
 * Apply general transformations to an entity
 */
export const transformEntity = (entity: Entity, transformations: Transformation[]): Entity => {
    const transformed = { ...entity };

    if (entity.geometry) {
        const geo = { ...entity.geometry };

        switch (entity.type?.toUpperCase()) {
            case 'LINE':
                geo.start = transformPoint(geo.start, transformations);
                geo.end = transformPoint(geo.end, transformations);
                break;

            case 'POLYLINE':
            case 'LWPOLYLINE':
            case 'SOLID':
            case 'TRACE':
                if (geo.points) {
                    geo.points = geo.points.map((p: any) => transformPoint(p, transformations));
                }
                break;

            case 'CIRCLE':
            case 'ARC':
                geo.center = transformPoint(geo.center, transformations);
                // Handle scaling of radius if symmetric
                const scaleX = transformations.reduce((s, t) => t.type === 'scale' ? s * t.scale.sx : s, 1);
                const scaleY = transformations.reduce((s, t) => t.type === 'scale' ? s * t.scale.sy : s, 1);
                if (Math.abs(scaleX) === Math.abs(scaleY)) {
                    geo.radius *= Math.abs(scaleX);
                } else {
                    // TODO: Convert Circle to Ellipse if non-uniform scaling
                }

                // Rotations and reflections affect arc angles
                transformations.forEach(t => {
                    if (t.type === 'rotate' && entity.type === 'ARC') {
                        geo.startAngle += t.rotation.angle;
                        geo.endAngle += t.rotation.angle;
                    }
                    if (t.type === 'mirror' && entity.type === 'ARC') {
                        // Approximate mirroring for arcs (complex due to winding)
                        // This is a simplified version
                        const mirStart = reflectPointAcrossLine(
                            { x: Math.cos(geo.startAngle), y: Math.sin(geo.startAngle) },
                            { x: 0, y: 0 },
                            { x: t.lineEnd.x - t.lineStart.x, y: t.lineEnd.y - t.lineStart.y }
                        );
                        const mirEnd = reflectPointAcrossLine(
                            { x: Math.cos(geo.endAngle), y: Math.sin(geo.endAngle) },
                            { x: 0, y: 0 },
                            { x: t.lineEnd.x - t.lineStart.x, y: t.lineEnd.y - t.lineStart.y }
                        );
                        geo.startAngle = Math.atan2(mirStart.y, mirStart.x);
                        geo.endAngle = Math.atan2(mirEnd.y, mirEnd.x);
                        // Swap angles to preserve clockwise/anti-clockwise if needed
                        [geo.startAngle, geo.endAngle] = [geo.endAngle, geo.startAngle];
                    }
                });
                break;

            case 'TEXT':
            case 'MTEXT':
                if (geo.position) {
                    geo.position = transformPoint(geo.position, transformations);
                }
                break;

            case 'SPLINE':
                if (geo.controlPoints) {
                    geo.controlPoints = geo.controlPoints.map((p: any) => transformPoint(p, transformations));
                }
                if (geo.points) {
                    geo.points = geo.points.map((p: any) => transformPoint(p, transformations));
                }
                break;

            case 'ELLIPSE':
                if (geo.center) {
                    geo.center = transformPoint(geo.center, transformations);
                }
                if (geo.majorAxisEndPoint) {
                    // Major axis is a relative vector in some DXF formats, but let's assume absolute point for now
                    geo.majorAxisEndPoint = transformPoint(geo.majorAxisEndPoint, transformations);
                }
                if (geo.majorAxis) {
                    // Also support 'majorAxis' field name
                    geo.majorAxis = transformPoint(geo.majorAxis, transformations);
                }
                break;
        }

        transformed.geometry = geo;
    }

    return transformed;
};

/**
 * Translate entity by offset
 */
export const translateEntity = (entity: Entity, dx: number, dy: number): Entity => {
    return transformEntity(entity, [{ type: 'translate', translation: { dx, dy } }]);
};

/**
 * Rotate entity
 */
export const rotateEntity = (entity: Entity, angle: number, origin?: { x: number, y: number }): Entity => {
    return transformEntity(entity, [{ type: 'rotate', rotation: { angle, origin } }]);
};

/**
 * Scale entity
 */
export const scaleEntity = (entity: Entity, sx: number, sy: number, origin?: { x: number, y: number }): Entity => {
    return transformEntity(entity, [{ type: 'scale', scale: { sx, sy }, origin }]);
};

/**
 * Mirror entity
 */
export const mirrorEntity = (entity: Entity, lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }): Entity => {
    return transformEntity(entity, [{ type: 'mirror', lineStart, lineEnd }]);
};

/**
 * Shear entity
 */
export const shearEntity = (entity: Entity, kx: number, ky: number, origin?: { x: number, y: number }): Entity => {
    return transformEntity(entity, [{ type: 'shear', shear: { kx, ky, origin } }]);
};
